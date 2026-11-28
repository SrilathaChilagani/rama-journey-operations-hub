// Family portal sign-in (server only): phone number → SMS code (Twilio Verify) → 30-day session.
// - The response to "send me a code" is identical for registered and unregistered numbers, so
//   the portal never reveals who is a patient's guardian. Unregistered numbers get no SMS and
//   can never pass the code step.
// - Access is re-derived on every request from `family_contacts`, so staff removing a contact
//   cuts access immediately, even mid-session.
// - Tokens are random, kept in httpOnly cookies, stored only as SHA-256.
import { createHash, randomBytes } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { query } from "./db";
import { checkSmsCode, maskPhone, sendSmsCode, verifyConfig } from "./twilio";

const SESSION_COOKIE = "rc_family";
const CHALLENGE_COOKIE = "rc_fchallenge";
const SESSION_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const MAX_SENDS = 3;
const RESEND_SECONDS = 30;
const MAX_CHALLENGES_PER_HOUR = 5; // per phone number, registered or not

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
const cookieOpts = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSeconds,
});

export type FamilyLink = { contactId: string; patientId: string; patientName: string; contactName: string; consented: boolean };
export type FamilyStartResult =
  | { status: "code-sent"; phoneHint: string }
  | { status: "error"; reason: "too-many" | "sms-unavailable" };
export type FamilyCodeResult = { status: "signed-in" } | { status: "error"; reason: "wrong-code" | "expired" };
export type FamilyResendResult =
  | { status: "code-sent"; phoneHint: string }
  | { status: "error"; reason: "too-soon" | "too-many" | "expired" | "sms-unavailable" };

async function isRegistered(phone: string) {
  const rows = await query(
    `select 1 from family_contacts c join patients p on p.id = c.patient_id where c.phone = $1 and c.active limit 1`,
    [phone],
  );
  return rows.length > 0;
}

export async function startFamilyLogin(phone: string): Promise<FamilyStartResult> {
  const [recent] = await query<{ n: number }>(
    `select count(*)::int as n from family_login_challenges where phone = $1 and created_at > now() - interval '1 hour'`,
    [phone],
  );
  if ((recent?.n ?? 0) >= MAX_CHALLENGES_PER_HOUR) return { status: "error", reason: "too-many" };
  const registered = await isRegistered(phone);
  if (registered && (!verifyConfig() || !(await sendSmsCode(phone)))) {
    return { status: "error", reason: "sms-unavailable" };
  }
  const token = newToken();
  await query(`delete from family_login_challenges where expires_at < now() - interval '1 hour'`);
  await query(
    `insert into family_login_challenges (token_hash, phone, registered, expires_at)
     values ($1, $2, $3, now() + make_interval(mins => $4))`,
    [sha256(token), phone, registered, CHALLENGE_MINUTES],
  );
  setCookie(CHALLENGE_COOKIE, token, cookieOpts(CHALLENGE_MINUTES * 60));
  return { status: "code-sent", phoneHint: maskPhone(phone) };
}

type Challenge = { token_hash: string; phone: string; registered: boolean; attempts: number; sends: number; seconds_since_send: number };

async function pendingChallenge(): Promise<Challenge | null> {
  const token = getCookie(CHALLENGE_COOKIE);
  if (!token) return null;
  const [c] = await query<Challenge>(
    `select token_hash, phone, registered, attempts, sends,
            extract(epoch from now() - last_sent_at)::int as seconds_since_send
       from family_login_challenges where token_hash = $1 and expires_at > now()`,
    [sha256(token)],
  );
  return c ?? null;
}

async function endChallenge(tokenHash: string) {
  await query(`update family_login_challenges set expires_at = now() where token_hash = $1`, [tokenHash]);
  deleteCookie(CHALLENGE_COOKIE, { path: "/" });
}

export async function verifyFamilyCode(code: string): Promise<FamilyCodeResult> {
  const c = await pendingChallenge();
  if (!c || c.attempts >= MAX_CODE_ATTEMPTS) {
    if (c) await endChallenge(c.token_hash);
    return { status: "error", reason: "expired" };
  }
  await query(`update family_login_challenges set attempts = attempts + 1 where token_hash = $1`, [c.token_hash]);
  // Re-check registration: staff may have removed the contact since the code was sent.
  const approved = c.registered && (await isRegistered(c.phone)) && (await checkSmsCode(c.phone, code));
  if (!approved) {
    if (c.attempts + 1 >= MAX_CODE_ATTEMPTS) {
      await endChallenge(c.token_hash);
      return { status: "error", reason: "expired" };
    }
    return { status: "error", reason: "wrong-code" };
  }
  await endChallenge(c.token_hash);
  const token = newToken();
  await query(
    `insert into family_sessions (token_hash, phone, expires_at) values ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), c.phone, SESSION_DAYS],
  );
  await query(`delete from family_sessions where expires_at < now()`);
  setCookie(SESSION_COOKIE, token, cookieOpts(SESSION_DAYS * 86400));
  return { status: "signed-in" };
}

export async function resendFamilyCode(): Promise<FamilyResendResult> {
  const c = await pendingChallenge();
  if (!c) return { status: "error", reason: "expired" };
  if (c.sends >= MAX_SENDS) return { status: "error", reason: "too-many" };
  if (c.seconds_since_send < RESEND_SECONDS) return { status: "error", reason: "too-soon" };
  if (c.registered && !(await sendSmsCode(c.phone))) return { status: "error", reason: "sms-unavailable" };
  await query(
    `update family_login_challenges set sends = sends + 1, last_sent_at = now() where token_hash = $1`,
    [c.token_hash],
  );
  return { status: "code-sent", phoneHint: maskPhone(c.phone) };
}

async function sessionPhone(): Promise<string | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const [s] = await query<{ phone: string }>(
    `select phone from family_sessions where token_hash = $1 and expires_at > now()`,
    [sha256(token)],
  );
  return s?.phone ?? null;
}

/** The patients this signed-in family member may see (empty if signed out or all access removed). */
export async function familyLinks(): Promise<FamilyLink[]> {
  const phone = await sessionPhone();
  if (!phone) return [];
  return query<FamilyLink>(
    `select c.id as "contactId", p.id as "patientId", p.name as "patientName", c.name as "contactName",
            c.consent_at is not null as consented
       from family_contacts c join patients p on p.id = c.patient_id
      where c.phone = $1 and c.active order by p.name`,
    [phone],
  );
}

/** Throws unless the signed-in family member is linked to this patient and has consented. */
export async function requireFamilyAccess(patientId: string): Promise<FamilyLink> {
  const link = (await familyLinks()).find((l) => l.patientId === patientId);
  if (!link) throw new Error("Not signed in");
  if (!link.consented) throw new Error("Consent required");
  return link;
}

export async function recordFamilyConsent(): Promise<void> {
  const phone = await sessionPhone();
  if (!phone) throw new Error("Not signed in");
  await query(`update family_contacts set consent_at = now() where phone = $1 and active and consent_at is null`, [phone]);
}

export async function familyLogout(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) await query(`delete from family_sessions where token_hash = $1`, [sha256(token)]);
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
