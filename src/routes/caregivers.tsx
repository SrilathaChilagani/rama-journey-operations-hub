import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { CADRE_TIERS, type Cadre } from "@/lib/care-rules";
import { addCaregiver, setCaregiverStatus } from "@/lib/api/console";
import { type Caregiver, run, useStore } from "@/lib/store";

export const Route = createFileRoute("/caregivers")({
  head: head("Caregivers", "Rama Cares caregiver roster by cadre, tier qualification and status."),
  component: () => (
    <AppShell title="Caregivers" subtitle="Employed, trained and assessed before the first shift. Aim for one backup on the bench for every 8–10 deployed.">
      <Caregivers />
    </AppShell>
  ),
});

function Caregivers() {
  const s = useStore()!;
  const [f, setF] = useState({ name: "", cadre: "Certified Caregiver" as Cadre, languages: "" });
  const deployed = s.caregivers.filter((c) => c.status === "Deployed").length;
  const bench = s.caregivers.filter((c) => c.status === "Bench").length;
  const add = async () => {
    if (!f.name.trim()) return;
    if (await run(() => addCaregiver({ data: f }))) setF({ ...f, name: "", languages: "" });
  };
  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">{deployed} deployed · {bench} on bench</p>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <input className={inputCls} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select className={inputCls} value={f.cadre} onChange={(e) => setF({ ...f, cadre: e.target.value as Cadre })}>
            {(Object.keys(CADRE_TIERS) as Cadre[]).map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={inputCls} placeholder="Languages" value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} />
          <button className={btnCls} disabled={!f.name.trim()} onClick={add}>Add caregiver</button>
        </div>
      </Card>
      {s.caregivers.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No caregivers yet. New caregivers start in Training.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.caregivers.map((c) => (
          <Card key={c.id}>
            <h3 className="font-display text-lg">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.cadre}{c.languages && ` · ${c.languages}`}</p>
            <p className="mt-2 text-xs text-muted-foreground">Qualified for {CADRE_TIERS[c.cadre].join(", ")}</p>
            <div className="mt-3 flex items-center justify-between">
              <Badge tone={c.status === "Deployed" ? "green" : c.status === "Bench" ? "primary" : "amber"}>{c.status}</Badge>
              <select aria-label={`Status for ${c.name}`} className="rounded-md border border-input bg-background px-2 py-1 text-xs" value={c.status}
                onChange={(e) => run(() => setCaregiverStatus({ data: { id: c.id, status: e.target.value as Caregiver["status"] } }))}>
                <option>Training</option><option>Bench</option><option>Deployed</option>
              </select>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
