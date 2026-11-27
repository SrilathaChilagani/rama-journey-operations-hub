// Twilio Verify over its REST API (server only) — no SDK needed. Twilio creates, sends and checks
// the codes, so nothing secret about a code is ever stored by us.
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID (Rama Cares subaccount).

type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

export function verifyConfig(env: Env = process.env) {
  const sid = env["TWILIO_ACCOUNT_SID"];
  const token = env["TWILIO_AUTH_TOKEN"];
  const service = env["TWILIO_VERIFY_SERVICE_SID"];
  return sid && token && service ? { sid, token, service } : null;
}

async function call(path: string, form: Record<string, string>, env: Env, fetchImpl: Fetch) {
  const cfg = verifyConfig(env);
  if (!cfg) throw new Error("SMS verification is not configured");
  // Local testing only: point at a fake Twilio. Ignored in production builds.
  const base =
    (env["NODE_ENV"] !== "production" && env["TWILIO_VERIFY_BASE_URL"]) || "https://verify.twilio.com";
  const res = await fetchImpl(`${base}/v2/Services/${cfg.service}/${path}`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${cfg.sid}:${cfg.token}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string };
  return { ok: res.ok, status: data.status };
}

export async function sendSmsCode(phone: string, env: Env = process.env, fetchImpl: Fetch = fetch) {
  const r = await call("Verifications", { To: phone, Channel: "sms" }, env, fetchImpl);
  return r.ok && r.status === "pending";
}

export async function checkSmsCode(
  phone: string,
  code: string,
  env: Env = process.env,
  fetchImpl: Fetch = fetch,
) {
  // Twilio answers 404 once a verification is used up or expired — treat as not approved.
  const r = await call("VerificationCheck", { To: phone, Code: code }, env, fetchImpl);
  return r.ok && r.status === "approved";
}

// "+919876543210" → "+91 ••••• 43210" — enough for staff to recognise their own number.
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
  return `${cc ? `+${cc} ` : ""}••••• ${digits.slice(-5)}`;
}

export const E164 = /^\+[1-9]\d{7,14}$/;
