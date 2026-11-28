// Notification sending (server only). Channels: WhatsApp (Twilio Messages API, Rama Cares
// subaccount) and email (Resend). Every attempt is written to `notifications`; failures are
// recorded, never thrown, so the staff/family action that triggered them always succeeds.
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, STAFF_ALERT_WHATSAPP,
//      RESEND_API_KEY, NOTIFY_EMAIL_FROM, STAFF_ALERT_EMAILS, APP_BASE_URL.
// Optional, once Meta approves templates: TWILIO_WA_TEMPLATE_<KIND> = Content SID (HX…) — the
// message body is then passed as template variable {{1}}.
import type { Message } from "@/lib/notify-messages";
import { reportError } from "@/lib/sentry";
import { query } from "./db";

export type Kind = "enquiry_new" | "concern_new" | "incident_family" | "daily_report";
type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
const TIMEOUT_MS = 8000;

// Local testing only: point at fake servers. Ignored in production.
const override = (env: Env, key: string, real: string) =>
  (env["NODE_ENV"] !== "production" && env[key]) || real;

const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function baseUrl(env: Env = process.env): string {
  const explicit = env["APP_BASE_URL"]?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = env["VERCEL_PROJECT_PRODUCTION_URL"];
  return vercel ? `https://${vercel}` : "";
}

async function withTimeout(fetchImpl: Fetch, url: string, init: RequestInit) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

type SendResult = { ok: true; id: string } | { ok: false; error: string; skipped?: boolean };

export async function sendWhatsApp(to: string, msg: Message, kind: Kind, env: Env = process.env, fetchImpl: Fetch = fetch): Promise<SendResult> {
  const sid = env["TWILIO_ACCOUNT_SID"], token = env["TWILIO_AUTH_TOKEN"], from = env["TWILIO_WHATSAPP_FROM"];
  if (!sid || !token || !from) return { ok: false, error: "WhatsApp not configured", skipped: true };
  const form = new URLSearchParams({ From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`, To: `whatsapp:${to}` });
  const template = env[`TWILIO_WA_TEMPLATE_${kind.toUpperCase()}`];
  if (template) {
    form.set("ContentSid", template);
    form.set("ContentVariables", JSON.stringify({ 1: msg.body }));
  } else form.set("Body", msg.body);
  try {
    const res = await withTimeout(fetchImpl, `${override(env, "TWILIO_API_BASE_URL", "https://api.twilio.com")}/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(`${sid}:${token}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    return res.ok && data.sid ? { ok: true, id: data.sid } : { ok: false, error: `Twilio ${data.code ?? res.status}: ${data.message ?? "send failed"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export async function sendEmail(to: string, msg: Message, env: Env = process.env, fetchImpl: Fetch = fetch): Promise<SendResult> {
  const key = env["RESEND_API_KEY"];
  if (!key) return { ok: false, error: "Email not configured", skipped: true };
  const from = env["NOTIFY_EMAIL_FROM"] || "Rama Cares <onboarding@resend.dev>";
  try {
    const res = await withTimeout(fetchImpl, `${override(env, "RESEND_BASE_URL", "https://api.resend.com")}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: msg.subject, text: msg.body }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    return res.ok && data.id ? { ok: true, id: data.id } : { ok: false, error: `Resend ${res.status}: ${data.message ?? "send failed"}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

type Target = { channel: "whatsapp" | "email"; to: string };

async function deliver(kind: Kind, targets: Target[], msg: Message, patientId: string | null) {
  await Promise.all(targets.map(async (t) => {
    const [row] = await query<{ id: string }>(
      `insert into notifications (kind, channel, recipient, subject, body, patient_id) values ($1, $2, $3, $4, $5, $6) returning id`,
      [kind, t.channel, t.to, msg.subject, msg.body, patientId],
    );
    const r = t.channel === "whatsapp" ? await sendWhatsApp(t.to, msg, kind) : await sendEmail(t.to, msg);
    await query(
      `update notifications set status = $2, error = $3, provider_id = $4, sent_at = case when $2 = 'sent' then now() end where id = $1`,
      [row!.id, r.ok ? "sent" : r.skipped ? "skipped" : "failed", r.ok ? null : r.error, r.ok ? r.id : null],
    );
  }));
}

/** Never throws — notifications must not break the action that triggered them. */
async function safely(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error("notification error", e);
    await reportError(e, { side: "server", path: "notifications" });
  }
}

export function staffTargets(env: Env = process.env): Target[] {
  return [
    ...list(env["STAFF_ALERT_WHATSAPP"]).map((to) => ({ channel: "whatsapp" as const, to })),
    ...list(env["STAFF_ALERT_EMAILS"]).map((to) => ({ channel: "email" as const, to })),
  ];
}

export const notifyStaff = (kind: Kind, msg: Message, patientId: string | null = null) =>
  safely(() => deliver(kind, staffTargets(), msg, patientId));

/** Family contacts who signed in, consented, and kept this kind of message switched on. */
export const notifyFamily = (kind: "incident_family" | "daily_report", patientId: string, msg: Message) =>
  safely(async () => {
    const pref = kind === "daily_report" ? "notify_daily" : "notify_incidents";
    const contacts = await query<{ phone: string }>(
      `select phone from family_contacts where patient_id = $1 and active and consent_at is not null and ${pref}`,
      [patientId],
    );
    await deliver(kind, contacts.map((c) => ({ channel: "whatsapp" as const, to: c.phone })), msg, patientId);
  });
