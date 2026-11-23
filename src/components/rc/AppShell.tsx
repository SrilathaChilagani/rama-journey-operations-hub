import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { resetDemo } from "@/lib/store";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/patients", label: "Patients" },
  { to: "/caregivers", label: "Caregivers" },
  { to: "/shifts", label: "Daily care log" },
  { to: "/incidents", label: "Incidents & complaints" },
] as const;

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-sidebar p-5 md:min-h-screen md:border-b-0 md:border-r">
        <Link to="/" className="block font-display text-2xl text-primary">Rama Cares</Link>
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
        <button onClick={() => confirm("Reset all demo data?") && resetDemo()} className="mt-8 text-xs text-muted-foreground underline">Reset demo data</button>
      </aside>
      <main className="p-5 md:p-10">
        <h1 className="font-display text-3xl text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
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
  ],
});
