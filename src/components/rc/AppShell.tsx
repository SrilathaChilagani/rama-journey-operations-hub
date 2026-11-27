import { Link } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { resetDemo } from "@/lib/store";
import { getStaff, staffLogin, staffLogout } from "@/lib/api/staff";

type StaffInfo = { name: string; email: string };
const StaffContext = createContext<StaffInfo | null>(null);

// Real sign-in: the server checks the password and sets an httpOnly session cookie.
// Server functions that read staff data check that session again on every call.
function StaffGate({ children }: { children: ReactNode }) {
  // undefined = still checking (server render / first paint) — avoids flashing either state.
  const [staff, setStaff] = useState<StaffInfo | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getStaff().then(setStaff, () => setStaff(null));
  }, []);

  if (staff === undefined) return <div className="min-h-screen bg-background" />;
  if (staff) return <StaffContext.Provider value={staff}>{children}</StaffContext.Provider>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await staffLogin({ data: { email, password } });
      if (res.ok) setStaff(res.staff);
      else setError(res.reason === "locked" ? "Too many attempts. Try again in 15 minutes." : "Email or password isn't right.");
    } catch {
      setError("Couldn't sign in just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xs">
        <p className="font-display text-2xl text-primary">Rama Cares</p>
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
        <Link to="/" className="mt-5 block text-xs text-muted-foreground underline">← Patient website</Link>
      </form>
    </div>
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
        <button onClick={() => confirm("Reset all demo data?") && resetDemo()} className="mt-3 text-xs text-muted-foreground underline">Reset demo data</button>
        <SignedInAs />
      </aside>
      <main className="p-5 md:p-10">
        <button type="button" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/console"))}
          className="mb-4 text-sm text-muted-foreground hover:text-primary">← Back</button>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
    </StaffGate>
  );
}

function SignedInAs() {
  const staff = useContext(StaffContext);
  if (!staff) return null;
  return (
    <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
      <p>Signed in as {staff.name}</p>
      <button onClick={() => staffLogout().finally(() => window.location.reload())} className="mt-2 underline">Sign out</button>
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
