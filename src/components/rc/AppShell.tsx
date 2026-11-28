import { Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { clearConsole, dismissError, loadConsole, useConsoleStatus } from "@/lib/store";
import { getConsole } from "@/lib/api/console";
import { getStaff, staffLogin, staffLogout, staffResendCode, staffVerifyCode } from "@/lib/api/staff";

type StaffInfo = { name: string; email: string };
const StaffContext = createContext<StaffInfo | null>(null);

const LOGIN_ERRORS = {
  invalid: "Email or password isn't right.",
  locked: "Too many attempts. Try again in 15 minutes.",
  "sms-unavailable": "We couldn't send your sign-in code. Please try again shortly or contact the admin.",
} as const;

// Real sign-in: the server checks the password (and, for staff with a phone on file, an SMS code)
// and sets an httpOnly session cookie. Staff server functions check that session on every call.
function StaffGate({ children }: { children: ReactNode }) {
  // undefined = still checking (server render / first paint) — avoids flashing either state.
  const [staff, setStaff] = useState<StaffInfo | null | undefined>(undefined);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getStaff().then(setStaff, () => setStaff(null));
  }, []);

  if (staff === undefined) return <div className="min-h-screen bg-background" />;
  if (staff) return <StaffContext.Provider value={staff}>{children}</StaffContext.Provider>;
  if (phoneHint)
    return <CodeStep phoneHint={phoneHint} onSignedIn={setStaff} onRestart={() => { setPhoneHint(null); setPassword(""); }} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await staffLogin({ data: { email, password } });
      if (res.status === "signed-in") setStaff(res.staff);
      else if (res.status === "code-sent") setPhoneHint(res.phoneHint);
      else setError(LOGIN_ERRORS[res.reason]);
    } catch {
      setError("Couldn't sign in just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <GateCard>
      <form onSubmit={submit}>
        <h1 className="mt-2 text-lg font-semibold">Staff sign-in</h1>
        <label className="mt-5 block text-sm">
          Email
          <input type="email" required autoFocus autoComplete="username" className={`mt-2 ${inputCls}`}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">
          Password
          <input type="password" required autoComplete="current-password" className={`mt-2 ${inputCls}`}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className={`mt-4 w-full ${btnCls}`}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </GateCard>
  );
}

function GateCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xs">
        <p className="font-display text-2xl text-primary">Rama Cares</p>
        {children}
        <Link to="/" className="mt-5 block text-xs text-muted-foreground underline">← Patient website</Link>
      </div>
    </div>
  );
}

const CODE_LENGTH = 6;
const RESEND_AFTER = 30;
type OtpNavigator = { credentials: { get(o: unknown): Promise<{ code?: string } | null> } };

// Step 2. Autofill: `autocomplete="one-time-code"` lets iPhone/iPad (Safari) and Android
// keyboards offer the code straight from the SMS; on Android Chrome the Web OTP API also fills
// it automatically when the SMS ends with the site's "@domain #code" line. A full code submits.
function CodeStep({ phoneHint, onSignedIn, onRestart }: {
  phoneHint: string; onSignedIn: (s: StaffInfo) => void; onRestart: () => void;
}) {
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);
  const submitted = useRef<string | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    const ac = new AbortController();
    (navigator as unknown as OtpNavigator).credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((otp) => otp?.code && setCode(otp.code.replace(/\D/g, "").slice(0, CODE_LENGTH)))
      .catch(() => { /* user dismissed, unsupported, or aborted */ });
    return () => ac.abort();
  }, []);

  const verify = async (value: string) => {
    if (busy || submitted.current === value) return;
    submitted.current = value;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await staffVerifyCode({ data: { code: value, remember } });
      if (res.status === "signed-in") return onSignedIn(res.staff);
      if (res.reason === "expired") {
        setError("This code has expired or had too many tries. Please sign in again.");
        window.setTimeout(onRestart, 2500);
      } else {
        setError("That code isn't right. Check the SMS and try again.");
        setCode("");
      }
    } catch {
      setError("Couldn't check the code just now. Please try again.");
      submitted.current = null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (code.length === CODE_LENGTH) void verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const resend = async () => {
    setError(null);
    setNotice(null);
    const res = await staffResendCode().catch(() => null);
    if (res?.status === "code-sent") {
      setNotice(`A new code is on its way to ${res.phoneHint}.`);
      setWait(RESEND_AFTER);
      submitted.current = null;
    } else if (res?.reason === "too-many" || res?.reason === "expired") {
      setError("No more codes for this sign-in. Please sign in again.");
      window.setTimeout(onRestart, 2500);
    } else {
      setError("Couldn't send a new code. Please wait a moment and try again.");
    }
  };

  return (
    <GateCard>
      <form onSubmit={(e) => { e.preventDefault(); submitted.current = null; void verify(code); }}>
        <h1 className="mt-2 text-lg font-semibold">Enter your sign-in code</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent a 6-digit code by SMS to {phoneHint}.</p>
        <label className="mt-5 block text-sm">
          Code
          <input name="code" required autoFocus autoComplete="one-time-code" inputMode="numeric"
            pattern="[0-9]*" maxLength={CODE_LENGTH} placeholder="••••••"
            className={`mt-2 ${inputCls} text-center font-mono text-2xl tracking-[0.5em]`}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))} />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Trust this device for 30 days
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mt-2 text-sm text-muted-foreground">{notice}</p>}
        <button type="submit" disabled={busy || code.length !== CODE_LENGTH} className={`mt-4 w-full ${btnCls}`}>
          {busy ? "Checking…" : "Verify and sign in"}
        </button>
        <div className="mt-4 flex justify-between text-xs">
          <button type="button" disabled={wait > 0} onClick={resend} className="text-primary underline disabled:text-muted-foreground disabled:no-underline">
            {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
          <button type="button" onClick={onRestart} className="text-muted-foreground underline">Use a different account</button>
        </div>
      </form>
    </GateCard>
  );
}

const NAV = [
  { to: "/console", label: "Overview" },
  { to: "/enquiries", label: "Enquiries" },
  { to: "/patients", label: "Patients" },
  { to: "/caregivers", label: "Caregivers" },
  { to: "/shifts", label: "Daily care log" },
  { to: "/incidents", label: "Incidents & complaints" },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <StaffGate>
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-sidebar p-5 md:min-h-screen md:border-b-0 md:border-r">
        <Link to="/console" className="block font-display text-2xl text-primary">Rama Cares</Link>
        <p className="mt-1 text-xs text-muted-foreground">Clinically supervised home care</p>
        <nav className="mt-6 flex flex-wrap gap-1 md:flex-col">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to="/" className="mt-8 block text-xs text-muted-foreground underline">← Patient website</Link>
        <SignedInAs />
      </aside>
      <main className="p-5 md:p-10">
        <button type="button" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/console"))}
          className="mb-4 text-sm text-muted-foreground hover:text-primary">← Back</button>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
        <div className="mt-8"><ConsoleData>{children}</ConsoleData></div>
      </main>
    </div>
    </StaffGate>
  );
}

// Loads shared console data once signed in; page content mounts only when it's ready, so pages
// can use useStore()! safely. Shows a server refusal (e.g. an SOP rule) above the page.
function ConsoleData({ children }: { children: ReactNode }) {
  const { data, error, busy } = useConsoleStatus();
  useEffect(() => {
    if (!data) void loadConsole(() => getConsole());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {error && (
        <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
          {data && <button onClick={dismissError} className="shrink-0 underline">Dismiss</button>}
        </div>
      )}
      {data ? <div aria-busy={busy}>{children}</div> : !error && <p className="text-sm text-muted-foreground">Loading…</p>}
    </>
  );
}

function SignedInAs() {
  const staff = useContext(StaffContext);
  if (!staff) return null;
  return (
    <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
      <p>Signed in as {staff.name}</p>
      <button onClick={() => { clearConsole(); staffLogout().finally(() => window.location.reload()); }} className="mt-2 underline">Sign out</button>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 shadow-xs ${className}`}>{children}</div>;
}
export const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
export const btnCls = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50";
export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "red" | "amber" | "green" | "primary" }) {
  const t = { muted: "bg-muted text-muted-foreground", red: "bg-destructive/15 text-destructive", amber: "bg-warning/20 text-warning-foreground", green: "bg-success/15 text-success", primary: "bg-primary/10 text-primary" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}
export const head = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — Rama Cares` }, { name: "description", content: description },
    { property: "og:title", content: `${title} — Rama Cares` }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    // Staff pages only — keep them out of search results.
    { name: "robots", content: "noindex, nofollow" },
  ],
});
