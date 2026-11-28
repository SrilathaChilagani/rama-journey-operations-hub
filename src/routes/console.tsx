import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, Card, head } from "@/components/rc/AppShell";
import { JOURNEY, nextNurseVisitDue } from "@/lib/care-rules";
import { fmt, useStore } from "@/lib/store";

export const Route = createFileRoute("/console")({
  head: head("Overview", "Rama Cares operations overview: patients, nurse visits, incidents."),
  component: () => (
    <AppShell title="Good to see you." subtitle="Care with the attention a patient's own children would give. Here is what needs you today.">
      <Index />
    </AppShell>
  ),
});

function Index() {
  const s = useStore()!;
  const now = new Date();
  const active = s.patients.filter((p) => p.journeyStep >= 5 && p.journeyStep < 8);
  const dueVisits = active.filter((p) => p.tier && p.careStart).map((p) => ({ p, due: nextNurseVisitDue(p.tier!, p.careStart!, p.lastNurseVisit) })).sort((a, b) => +a.due - +b.due);
  const openIncidents = s.incidents.filter((i) => !i.resolved);
  const stats = [
    { label: "Active patients", value: active.length },
    { label: "Awaiting assessment", value: s.patients.filter((p) => p.journeyStep <= 2).length },
    { label: "Caregivers on bench", value: s.caregivers.filter((c) => c.status === "Bench").length },
    { label: "Open incidents", value: openIncidents.length },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((x) => <Card key={x.label}><p className="text-sm text-muted-foreground">{x.label}</p><p className="mt-1 font-display text-4xl text-primary">{x.value}</p></Card>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Nurse supervision visits</h2>
          <ul className="mt-4 divide-y divide-border">
            {dueVisits.map(({ p, due }) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span>{p.name} <span className="text-muted-foreground">· {p.tier}</span></span>
                <Badge tone={due < now ? "red" : "primary"}>{due < now ? "Overdue " : "Due "}{fmt(due)}</Badge>
              </li>
            ))}
            {dueVisits.length === 0 && <li className="py-3 text-sm text-muted-foreground">No active placements.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Open incidents</h2>
          <ul className="mt-4 divide-y divide-border">
            {openIncidents.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3 text-sm">
                <span>{s.patients.find((p) => p.id === i.patientId)?.name} — {i.kind}</span>
                <Badge tone={i.severity === "Red" ? "red" : i.severity === "Amber" ? "amber" : "green"}>{i.severity}</Badge>
              </li>
            ))}
            {openIncidents.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nothing open.</li>}
          </ul>
          <Link to="/incidents" className="mt-3 inline-block text-sm text-primary underline">Go to incidents</Link>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-display text-xl">Client journey</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {JOURNEY.map((j) => (
            <div key={j.step} className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Step {j.step}</p>
              <p className="text-sm font-medium">{j.name}</p>
              <p className="mt-2 font-display text-2xl text-primary">{s.patients.filter((p) => p.journeyStep === j.step).length}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
