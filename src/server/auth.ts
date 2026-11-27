// Staff sign-in (server only). Step 1: email + password. Step 2 (staff with a phone on file):
// a 6-digit SMS code from Twilio Verify, unless this device was trusted in the last 30 days.
// Every token (session, pending challenge, trusted device) is random, kept in an httpOnly
// cookie, and stored only as a SHA-256 in the database.
import { createHash, randomBytes } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { query } from "./db";
import { DUMMY_HASH, verifyPassword } from "./password";
import { checkSmsCode, maskPhone, sendSmsCode, verifyConfig } from "./twilio";

export const SESSION_COOKIE = "rc_staff";
const CHALLENGE_COOKIE = "rc_challenge";
const TRUSTED_COOKIE = "rc_trusted";
const SESSION_DAYS = 30;
const TRUSTED_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const MAX_FAILED = 5; // wrong passwords before a 15-minute lock
const LOCK_MINUTES = 15;
const MAX_CODE_ATTEMPTS = 5; // wrong codes before the password must be entered again
const MAX_SENDS = 3; // first send + 2 resends per challenge
const RESEND_SECONDS = 30;

export type Staff = { id: string; email: string; name: string; role: "admin" | "staff" };
type UserRow = Staff & { phone: string | null };

export type LoginResult =
  | { status: "signed-in"; staff: Staff }
  | { status: "code-sent"; phoneHint: string }
  | { status: "error"; reason: "invalid" | "locked" | "sms-unavailable" };

export type CodeResult =
  | { status: "signed-in"; staff: Staff }
  | { status: "error"; reason: "wrong-code" | "expired" };

export type ResendResult =
  | { status: "code-sent"; phoneHint: string }
  | { status: "error"; reason: "too-soon" | "too-many" | "expired" | "sms-unavailable" };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
const cookieOpts = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSeconds,
});
const toStaff = (u: Staff): Staff => ({ id: u.id, email: u.email, name: u.name, role: u.role });

export async function currentStaff(): Promise<Staff | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const rows = await query<Staff>(
    `select u.id, u.email, u.name, u.role
       from staff_sessions s join staff_users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now() and u.active`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}

export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) throw new Error("Not signed in");
  return staff;
}

async function startSession(user: Staff): Promise<{ status: "signed-in"; staff: Staff }> {
  const token = newToken();
  await query(
    `insert into staff_sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), user.id, SESSION_DAYS],
  );
  await query(`delete from staff_sessions where expires_at < now()`);
  setCookie(SESSION_COOKIE, token, cookieOpts(SESSION_DAYS * 86400));
  return { status: "signed-in", staff: toStaff(user) };
}

async function deviceIsTrusted(userId: string): Promise<boolean> {
  const token = getCookie(TRUSTED_COOKIE);
  if (!token) return false;
  const rows = await query(
    `select 1 from staff_trusted_devices where token_hash = $1 and user_id = $2 and expires_at > now()`,
    [sha256(token), userId],
  );
  return rows.length > 0;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const rows = await query<UserRow & { password_hash: string; locked: boolean }>(
    `select id, email, name, role, phone, password_hash,
            coalesce(locked_until > now(), false) as locked
       from staff_users where email = $1 and active`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user) return { status: "error", reason: "invalid" };
  if (user.locked) return { status: "error", reason: "locked" };
  if (!valid) {
    await query(
      `update staff_users
          set failed_attempts = failed_attempts + 1,
              locked_until = case when failed_attempts + 1 >= $2
                                  then now() + make_interval(mins => $3) end
        where id = $1`,
      [user.id, MAX_FAILED, LOCK_MINUTES],
    );
    return { status: "error", reason: "invalid" };
  }
  await query(`update staff_users set failed_attempts = 0, locked_until = null where id = $1`, [user.id]);

  // No phone on file yet → password only. Phone on file → SMS step is required (fail closed).
  if (!user.phone || (await deviceIsTrusted(user.id))) return startSession(user);
  if (!verifyConfig() || !(await sendSmsCode(user.phone))) {
    return { status: "error", reason: "sms-unavailable" };
  }
  const token = newToken();
  await query(`delete from staff_login_challenges where user_id = $1 or expires_at < now()`, [user.id]);
  await query(
    `insert into staff_login_challenges (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(mins => $3))`,
    [sha256(token), user.id, CHALLENGE_MINUTES],
  );
  setCookie(CHALLENGE_COOKIE, token, cookieOpts(CHALLENGE_MINUTES * 60));
  return { status: "code-sent", phoneHint: maskPhone(user.phone) };
}

type ChallengeRow = UserRow & {
  token_hash: string;
  attempts: number;
  sends: number;
  seconds_since_send: number;
};

async function pendingChallenge(): Promise<ChallengeRow | null> {
  const token = getCookie(CHALLENGE_COOKIE);
  if (!token) return null;
  const rows = await query<ChallengeRow>(
    `select c.token_hash, c.attempts, c.sends,
            extract(epoch from now() - c.last_sent_at)::int as seconds_since_send,
            u.id, u.email, u.name, u.role, u.phone
       from staff_login_challenges c join staff_users u on u.id = c.user_id
      where c.token_hash = $1 and c.expires_at > now() and u.active and u.phone is not null`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}

async function endChallenge(tokenHash: string) {
  await query(`delete from staff_login_challenges where token_hash = $1`, [tokenHash]);
  deleteCookie(CHALLENGE_COOKIE, { path: "/" });
}

export async function verifyCode(code: string, rememberDevice: boolean): Promise<CodeResult> {
  const c = await pendingChallenge();
  if (!c || c.attempts >= MAX_CODE_ATTEMPTS) {
    if (c) await endChallenge(c.token_hash);
    return { status: "error", reason: "expired" };
  }
  await query(`update staff_login_challenges set attempts = attempts + 1 where token_hash = $1`, [c.token_hash]);
  if (!(await checkSmsCode(c.phone!, code))) {
    if (c.attempts + 1 >= MAX_CODE_ATTEMPTS) {
      await endChallenge(c.token_hash);
      return { status: "error", reason: "expired" };
    }
    return { status: "error", reason: "wrong-code" };
  }
  await endChallenge(c.token_hash);
  if (rememberDevice) {
    const token = newToken();
    await query(
      `insert into staff_trusted_devices (token_hash, user_id, expires_at)
       values ($1, $2, now() + make_interval(days => $3))`,
      [sha256(token), c.id, TRUSTED_DAYS],
    );
    await query(`delete from staff_trusted_devices where expires_at < now()`);
    setCookie(TRUSTED_COOKIE, token, cookieOpts(TRUSTED_DAYS * 86400));
  }
  return startSession(c);
}

export async function resendCode(): Promise<ResendResult> {
  const c = await pendingChallenge();
  if (!c) return { status: "error", reason: "expired" };
  if (c.sends >= MAX_SENDS) return { status: "error", reason: "too-many" };
  if (c.seconds_since_send < RESEND_SECONDS) return { status: "error", reason: "too-soon" };
  if (!(await sendSmsCode(c.phone!))) return { status: "error", reason: "sms-unavailable" };
  await query(
    `update staff_login_challenges set sends = sends + 1, last_sent_at = now() where token_hash = $1`,
    [c.token_hash],
  );
  return { status: "code-sent", phoneHint: maskPhone(c.phone!) };
}

export async function logout(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) await query(`delete from staff_sessions where token_hash = $1`, [sha256(token)]);
  deleteCookie(SESSION_COOKIE, { path: "/" });
  // The trusted-device cookie is kept on purpose: signing out ≠ forgetting this device.
}
