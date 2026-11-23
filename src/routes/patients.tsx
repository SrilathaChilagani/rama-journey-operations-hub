import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { JOURNEY, TIERS, cadreQualifies, canAssignCaregiver, type Tier } from "@/lib/care-rules";
import { type Patient, uid, update, useStore } from "@/lib/store";

export const Route = createFileRoute("/patients")({
  head: head("Patients", "Patients moving through the Rama Cares 8-step client journey."),
  component: Patients,
});

const patch = (id: string, p: Partial<Patient>) => update((s) => ({ ...s, patients: s.patients.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

function Patients() {
  const s = useStore();
  const [f, setF] = useState({ name: "", age: "", condition: "", guardian: "", guardianPhone: "", serviceLine: "Post-hospitalisation" as Patient["serviceLine"] });
  const add = () => {
    if (!f.name) return;
    update((st) => ({ ...st, patients: [...st.patients, { id: uid(), ...f, age: Number(f.age) || 0, journeyStep: 1, tier: null, caregiverId: null, backupId: null, careStart: null, lastNurseVisit: null }] }));
    setF({ ...f, name: "", age: "", condition: "", guardian: "", guardianPhone: "" });
  };
  return (
    <AppShell title="Patients" subtitle="A nurse sets the tier at assessment — never the sales conversation. No caregiver can be assigned until step 2 is complete.">
      <Card>
        <h2 className="font-display text-xl">New enquiry</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className={inputCls} placeholder="Patient name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={inputCls} placeholder="Age" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <input className={inputCls} placeholder="Condition / hospital" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} />
          <input className={inputCls} placeholder="Guardian (decision-maker)" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} />
          <input className={inputCls} placeholder="Guardian phone / WhatsApp" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} />
          <select className={inputCls} value={f.serviceLine} onChange={(e) => setF({ ...f, serviceLine: e.target.value as Patient["serviceLine"] })}>
            <option>Post-hospitalisation</option><option>Elderly care</option><option>Rehabilitation</option>
          </select>
        </div>
        <button className={`${btnCls} mt-4`} onClick={add}>Record enquiry</button>
      </Card>
      <div className="mt-6 space-y-4">
        {s.patients.map((p) => {
          const assignable = canAssignCaregiver(p);
          const eligible = s.caregivers.filter((c) => p.tier && cadreQualifies(c.cadre, p.tier));
          return (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl">{p.name}, {p.age}</h3>
                  <p className="text-sm text-muted-foreground">{p.condition} · {p.serviceLine} · Guardian: {p.guardian} {p.guardianPhone}</p>
                </div>
                <div className="flex gap-2">
                  {p.tier ? <Badge tone="primary">{p.tier} {TIERS[p.tier].name}</Badge> : <Badge>No tier yet</Badge>}
                  <Badge>Step {p.journeyStep}: {JOURNEY[p.journeyStep - 1]?.name}</Badge>
                </div>
              </div>
              <div className="mt-4 flex gap-1">
                {JOURNEY.map((j) => <div key={j.step} title={j.name} className={`h-1.5 flex-1 rounded-full ${j.step <= p.journeyStep ? "bg-primary" : "bg-muted"}`} />)}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <label className="text-xs text-muted-foreground">Tier (set by nurse)
                  <select className={inputCls} value={p.tier ?? ""} onChange={(e) => patch(p.id, { tier: (e.target.value || null) as Tier | null })}>
                    <option value="">—</option>
                    {(Object.keys(TIERS) as Tier[]).map((t) => <option key={t} value={t}>{t} {TIERS[t].name}</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">Caregiver
                  <select disabled={!assignable} className={inputCls} value={p.caregiverId ?? ""} onChange={(e) => patch(p.id, { caregiverId: e.target.value || null })}>
                    <option value="">—</option>{eligible.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.cadre})</option>)}
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">Named backup
                  <select disabled={!assignable} className={inputCls} value={p.backupId ?? ""} onChange={(e) => patch(p.id, { backupId: e.target.value || null })}>
                    <option value="">—</option>{eligible.filter((c) => c.id !== p.caregiverId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button className={btnCls} disabled={p.journeyStep >= 8 || (p.journeyStep === 2 && !p.tier) || (p.journeyStep === 4 && !p.caregiverId)}
                    onClick={() => patch(p.id, { journeyStep: p.journeyStep + 1, ...(p.journeyStep === 4 ? { careStart: new Date().toISOString() } : {}) })}>
                    Advance
                  </button>
                  {p.careStart && <button className="rounded-md border border-input px-3 py-2 text-sm" onClick={() => patch(p.id, { lastNurseVisit: new Date().toISOString() })}>Log nurse visit</button>}
                </div>
              </div>
              {!assignable && <p className="mt-3 text-xs text-muted-foreground">Complete the home assessment and set a tier to unlock caregiver assignment.</p>}
              {p.tier && <p className="mt-2 text-xs text-muted-foreground">Supervision: {TIERS[p.tier].supervision}. Staff grade: {TIERS[p.tier].staff}.</p>}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
