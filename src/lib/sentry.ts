// Minimal Sentry reporter: no SDK, works in the browser and on the server (Vercel). Sends one
// event per real fault to the DSN in VITE_SENTRY_DSN; does nothing when it's empty. Expected
// refusals (not signed in, SOP rules) are never reported — see lib/errors.ts.
// Privacy: no request bodies, cookies or form data are sent — only the error, its stack, the page
// path and a few tags, so patient details stay out of Sentry.
import { isRefusal } from "./errors";

type Dsn = { endpoint: string; key: string; dsn: string };
type Frame = { function?: string; filename?: string; lineno?: number; colno?: number; in_app?: boolean };

const MAX_PER_MINUTE = 10; // a crash loop must not flood Sentry
let sentThisMinute = 0;
let minute = 0;
const recent = new Set<string>();

export function parseDsn(dsn: string | undefined): Dsn | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const project = u.pathname.replace(/^\/+/, "");
    if (!u.username || !project) return null;
    return { endpoint: `${u.protocol}//${u.host}/api/${project}/envelope/`, key: u.username, dsn };
  } catch {
    return null;
  }
}

function currentDsn(): Dsn | null {
  const fromBuild = import.meta.env?.["VITE_SENTRY_DSN"] as string | undefined;
  const fromServer = typeof process !== "undefined" ? process.env?.["SENTRY_DSN"] || process.env?.["VITE_SENTRY_DSN"] : undefined;
  return parseDsn(fromBuild || fromServer);
}

/** V8 / Firefox / Safari stack lines → Sentry frames (oldest call first, as Sentry expects). */
export function parseStack(stack: string | undefined): Frame[] {
  if (!stack) return [];
  const frames: Frame[] = [];
  for (const line of stack.split("\n").slice(0, 50)) {
    const v8 = line.match(/^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/);
    const gecko = !v8 && line.match(/^\s*(.*?)@(.+?):(\d+):(\d+)\s*$/);
    const m = v8 || gecko;
    if (!m) continue;
    const filename = m[2]!;
    frames.push({
      function: m[1] || "?",
      filename,
      lineno: Number(m[3]),
      colno: Number(m[4]),
      in_app: !/node_modules|node:internal/.test(filename),
    });
  }
  return frames.reverse();
}

/** Database errors can echo values back ("Key (phone)=(+9198…)"); mask phone numbers and emails. */
export const scrub = (s: string) =>
  s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]").replace(/\+?\d[\d\s-]{7,}\d/g, "[number]");

const hex = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");

export function buildEnvelope(error: unknown, ctx: { side: "browser" | "server"; path?: string; tags?: Record<string, string> }, dsn: Dsn): string {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error)?.slice(0, 500) ?? String(error));
  const event_id = hex(16);
  const event = {
    event_id,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment: import.meta.env?.PROD ? "production" : "development",
    tags: { side: ctx.side, ...ctx.tags },
    transaction: ctx.path,
    exception: { values: [{ type: err.name || "Error", value: scrub(err.message).slice(0, 1000), stacktrace: { frames: parseStack(err.stack) } }] },
  };
  return [
    JSON.stringify({ event_id, sent_at: new Date().toISOString(), dsn: dsn.dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");
}

/** Report a real fault to Sentry. Never throws; safe to call anywhere. */
export async function reportError(error: unknown, ctx: { side: "browser" | "server"; path?: string; tags?: Record<string, string> }): Promise<void> {
  try {
    if (isRefusal(error)) return;
    const dsn = currentDsn();
    if (!dsn) return;
    const now = Math.floor(Date.now() / 60000);
    if (now !== minute) { minute = now; sentThisMinute = 0; recent.clear(); }
    const sig = `${error instanceof Error ? error.message : String(error)}|${ctx.path ?? ""}`;
    if (recent.has(sig) || sentThisMinute >= MAX_PER_MINUTE) return;
    recent.add(sig);
    sentThisMinute++;
    await fetch(`${dsn.endpoint}?sentry_key=${dsn.key}&sentry_version=7&sentry_client=rama-cares/1.0`, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: buildEnvelope(error, ctx, dsn),
      keepalive: ctx.side === "browser",
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    /* reporting must never break the app */
  }
}

/** Browser: report uncaught errors and unhandled promise rejections. Call once on the client. */
export function installBrowserReporting() {
  if (typeof window === "undefined" || (window as { __rcSentry?: boolean }).__rcSentry) return;
  (window as { __rcSentry?: boolean }).__rcSentry = true;
  window.addEventListener("error", (e) => void reportError(e.error ?? e.message, { side: "browser", path: location.pathname }));
  window.addEventListener("unhandledrejection", (e) => void reportError(e.reason, { side: "browser", path: location.pathname }));
}
