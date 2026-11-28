import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Card, head } from "@/components/rc/AppShell";
import { listNotifications, type NotificationRow } from "@/lib/api/console";

export const Route = createFileRoute("/notifications")({
  head: head("Notifications", "WhatsApp and email messages Rama Cares has sent, and any that failed."),
  component: () => (
    <AppShell title="Notifications" subtitle="Every WhatsApp and email the system sends — staff alerts and family updates. Failed sends are shown with the reason.">
      <Notifications />
    </AppShell>
  ),
});

const KIND: Record<string, string> = {
  enquiry_new: "New enquiry → staff",
  concern_new: "Family concern → staff",
  incident_family: "Incident → family",
  daily_report: "Daily report → family",
};
const TONE = { sent: "green", failed: "red", skipped: "muted", pending: "amber" } as const;

function Notifications() {
  const [rows, setRows] = useState<NotificationRow[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    listNotifications().then(setRows, () => setRows([]));
  }, []);
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const failed = rows.filter((r) => r.status === "failed").length;
  const skipped = rows.filter((r) => r.status === "skipped").length;
  return (
    <>
      {(failed > 0 || skipped > 0) && (
        <p className="mb-4 text-sm text-muted-foreground">
          {failed > 0 && <span className="font-medium text-destructive">{failed} failed. </span>}
          {skipped > 0 && <span>{skipped} skipped because WhatsApp or email isn't set up yet.</span>}
        </p>
      )}
      {rows.length === 0 && <Card><p className="text-sm text-muted-foreground">Nothing sent yet.</p></Card>}
      <div className="space-y-3">
        {rows.map((n) => (
          <Card key={n.id}>
            <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen(open === n.id ? null : n.id)} aria-expanded={open === n.id}>
              <span className="text-sm">
                <span className="font-medium">{KIND[n.kind] ?? n.kind}</span>
                <span className="text-muted-foreground"> · {n.channel === "whatsapp" ? "WhatsApp" : "Email"} to {n.recipient}{n.patient && ` · ${n.patient}`}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                <Badge tone={TONE[n.status]}>{n.status}</Badge>
              </span>
            </button>
            {n.error && <p className="mt-2 text-xs text-destructive">{n.error}</p>}
            {open === n.id && <pre className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-xs">{n.body}</pre>}
          </Card>
        ))}
      </div>
    </>
  );
}
