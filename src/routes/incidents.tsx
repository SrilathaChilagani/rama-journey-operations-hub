import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { SEVERITY, complaintDeadlines, type Severity } from "@/lib/care-rules";
import { fmt, uid, update, useStore } from "@/lib/store";

export const Route = createFileRoute("/incidents")({
  head: head("Incidents & complaints", "Escalation by rule: red, amber and green incidents, plus complaint deadlines."),
  component: Incidents,
});

const tone = (s: Severity): "red" | "amber" | "green" => (s === "Red" ? "red" : s === "Amber" ? "amber" : "green");

function Incidents() {
  const s = useStore();
  const [f, setF] = useState({ patientId: "", severity: "Amber" as Severity, kind: "", description: "" });
  const [c, setC] = useState({ patientId: "", text: "" });
  const name = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  return (
    <AppShell title="Incidents & complaints" subtitle="The caregiver does not decide whether to call — the rule decides.">
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(SEVERITY) as Severity[]).map((k) => (
          <Card key={k}><Badge tone={tone(k)}>{k}</Badge><p className="mt-3 text-sm font-medium">{SEVERITY[k].action}</p><p className="mt-2 text-xs text-muted-foreground">{SEVERITY[k].response}</p></Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Report incident</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}><option value="">Patient</option>{s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as Severity })}><option>Red</option><option>Amber</option><option>Green</option></select>
            <input className={`${inputCls} sm:col-span-2`} placeholder="Type (fall, medication error, wound…)" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="What happened, what was done" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Required action: {SEVERITY[f.severity].action}</p>
          <button className={`${btnCls} mt-3`} disabled={!f.patientId || !f.kind} onClick={() => { update((st) => ({ ...st, incidents: [{ id: uid(), ...f, at: new Date().toISOString(), resolved: false }, ...st.incidents] })); setF({ ...f, kind: "", description: "" }); }}>Report</button>
          <ul className="mt-5 divide-y divide-border">
            {s.incidents.map((i) => (
              <li key={i.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span><Badge tone={tone(i.severity)}>{i.severity}</Badge> {name(i.patientId)} — {i.kind}</span>
                  <button className="text-xs text-primary underline" onClick={() => update((st) => ({ ...st, incidents: st.incidents.map((x) => (x.id === i.id ? { ...x, resolved: !x.resolved } : x)) }))}>{i.resolved ? "Reopen" : "Mark resolved"}</button></div>
                <p className="mt-1 text-muted-foreground">{fmt(i.at)} · {i.description}{i.resolved && " · Resolved"}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Complaints</h2>
          <p className="mt-1 text-xs text-muted-foreground">Acknowledge within 2 hours; resolve or give a plan within 48 hours.</p>
          <div className="mt-3 grid gap-3">
            <select className={inputCls} value={c.patientId} onChange={(e) => setC({ ...c, patientId: e.target.value })}><option value="">Patient</option>{s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <textarea className={inputCls} rows={2} placeholder="Complaint" value={c.text} onChange={(e) => setC({ ...c, text: e.target.value })} />
          </div>
          <button className={`${btnCls} mt-3`} disabled={!c.patientId || !c.text} onClick={() => { update((st) => ({ ...st, complaints: [{ id: uid(), ...c, at: new Date().toISOString(), acknowledged: false, resolved: false }, ...st.complaints] })); setC({ patientId: "", text: "" }); }}>Log complaint</button>
          <ul className="mt-5 divide-y divide-border">
            {s.complaints.map((k) => {
              const dl = complaintDeadlines(k.at);
              const set = (p: Partial<typeof k>) => update((st) => ({ ...st, complaints: st.complaints.map((x) => (x.id === k.id ? { ...x, ...p } : x)) }));
              return (
                <li key={k.id} className="py-3 text-sm">
                  <p>{name(k.patientId)}: {k.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ack by {dl.acknowledgeBy.toLocaleString("en-IN")} · Resolve by {dl.resolveBy.toLocaleString("en-IN")}</p>
                  <div className="mt-2 flex gap-3 text-xs">
                    <label><input type="checkbox" checked={k.acknowledged} onChange={(e) => set({ acknowledged: e.target.checked })} /> Acknowledged</label>
                    <label><input type="checkbox" checked={k.resolved} onChange={(e) => set({ resolved: e.target.checked })} /> Resolved</label>
                  </div>
                </li>
              );
            })}
            {s.complaints.length === 0 && <li className="py-3 text-sm text-muted-foreground">No complaints logged.</li>}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
