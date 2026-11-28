import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { SEVERITY, complaintDeadlines, type Severity } from "@/lib/care-rules";
import { addComplaint, addIncident, setComplaintState, setIncidentResolved } from "@/lib/api/console";
import { fmt, run, useStore } from "@/lib/store";

export const Route = createFileRoute("/incidents")({
  head: head("Incidents & complaints", "Escalation by rule: red, amber and green incidents, plus complaint deadlines."),
  component: () => (
    <AppShell title="Incidents & complaints" subtitle="The caregiver does not decide whether to call — the rule decides.">
      <Incidents />
    </AppShell>
  ),
});

const tone = (s: Severity): "red" | "amber" | "green" => (s === "Red" ? "red" : s === "Amber" ? "amber" : "green");
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Incidents() {
  const s = useStore()!;
  const [f, setF] = useState({ patientId: "", severity: "Amber" as Severity, kind: "", description: "" });
  const [c, setC] = useState({ patientId: "", text: "" });
  const name = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  const report = async () => {
    if (await run(() => addIncident({ data: f }))) setF({ ...f, kind: "", description: "" });
  };
  const logComplaint = async () => {
    if (await run(() => addComplaint({ data: c }))) setC({ patientId: "", text: "" });
  };
  const now = Date.now();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(SEVERITY) as Severity[]).map((k) => (
          <Card key={k}><Badge tone={tone(k)}>{k}</Badge><p className="mt-3 text-sm font-medium">{SEVERITY[k].action}</p><p className="mt-2 text-xs text-muted-foreground">{SEVERITY[k].response}</p></Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl">Report incident</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select aria-label="Incident patient" className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}><option value="">Patient</option>{s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select aria-label="Severity" className={inputCls} value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as Severity })}><option>Red</option><option>Amber</option><option>Green</option></select>
            <input className={`${inputCls} sm:col-span-2`} placeholder="Type (fall, medication error, wound…)" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="What happened, what was done" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Required action: {SEVERITY[f.severity].action}</p>
          <button className={`${btnCls} mt-3`} disabled={!f.patientId || !f.kind.trim()} onClick={report}>Report</button>
          <ul className="mt-5 divide-y divide-border">
            {s.incidents.map((i) => (
              <li key={i.id} className="py-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span><Badge tone={tone(i.severity)}>{i.severity}</Badge> {name(i.patientId)} — {i.kind}</span>
                  <button className="text-xs text-primary underline" onClick={() => run(() => setIncidentResolved({ data: { id: i.id, resolved: !i.resolved } }))}>{i.resolved ? "Reopen" : "Mark resolved"}</button></div>
                <p className="mt-1 text-muted-foreground">{fmt(i.at)} · {i.description}{i.resolved && " · Resolved"}</p>
              </li>
            ))}
            {s.incidents.length === 0 && <li className="py-3 text-sm text-muted-foreground">No incidents reported.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Complaints</h2>
          <p className="mt-1 text-xs text-muted-foreground">Acknowledge within 2 hours; resolve or give a plan within 48 hours.</p>
          <div className="mt-3 grid gap-3">
            <select aria-label="Complaint patient" className={inputCls} value={c.patientId} onChange={(e) => setC({ ...c, patientId: e.target.value })}><option value="">Patient</option>{s.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <textarea className={inputCls} rows={2} placeholder="Complaint" value={c.text} onChange={(e) => setC({ ...c, text: e.target.value })} />
          </div>
          <button className={`${btnCls} mt-3`} disabled={!c.patientId || !c.text.trim()} onClick={logComplaint}>Log complaint</button>
          <ul className="mt-5 divide-y divide-border">
            {s.complaints.map((k) => {
              const dl = complaintDeadlines(k.at);
              const ackLate = !k.acknowledged && now > +dl.acknowledgeBy;
              const resolveLate = !k.resolved && now > +dl.resolveBy;
              const set = (field: "acknowledged" | "resolved", value: boolean) =>
                run(() => setComplaintState({ data: { id: k.id, field, value } }));
              return (
                <li key={k.id} className="py-3 text-sm">
                  <p>{name(k.patientId)}: {k.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Received {when(k.at)} · <span className={ackLate ? "font-medium text-destructive" : ""}>Ack by {when(dl.acknowledgeBy.toISOString())}</span> · <span className={resolveLate ? "font-medium text-destructive" : ""}>Resolve by {when(dl.resolveBy.toISOString())}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <label><input type="checkbox" checked={k.acknowledged} onChange={(e) => set("acknowledged", e.target.checked)} /> Acknowledged{k.acknowledgedAt && ` ${when(k.acknowledgedAt)}`}</label>
                    <label><input type="checkbox" checked={k.resolved} onChange={(e) => set("resolved", e.target.checked)} /> Resolved{k.resolvedAt && ` ${when(k.resolvedAt)}`}</label>
                  </div>
                </li>
              );
            })}
            {s.complaints.length === 0 && <li className="py-3 text-sm text-muted-foreground">No complaints logged.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
