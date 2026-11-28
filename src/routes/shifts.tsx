import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { addShiftLog } from "@/lib/api/console";
import { fmt, run, useStore, type ShiftLog } from "@/lib/store";

export const Route = createFileRoute("/shifts")({
  head: head("Daily care log", "Shift reports with vitals, meals, medicines and mood, ready to share with the guardian."),
  component: () => (
    <AppShell title="Daily care log" subtitle="Record as you go, not from memory. Every log becomes the guardian's daily WhatsApp summary.">
      <Shifts />
    </AppShell>
  ),
});

const empty = { patientId: "", bp: "", spo2: "", meals: "", meds: "", mood: "", notes: "" };

function Shifts() {
  const s = useStore()!;
  const [f, setF] = useState(empty);
  const [copied, setCopied] = useState<string | null>(null);
  const placed = s.patients.filter((p) => p.caregiverId);
  const name = (id: string) => s.patients.find((p) => p.id === id)?.name ?? "";
  const summary = (l: ShiftLog) =>
    `Rama Cares daily report — ${name(l.patientId)}, ${fmt(l.date)}\nBP ${l.bp}, SpO2 ${l.spo2}%\nMeals/fluids: ${l.meals}\nMedicines: ${l.meds}\nMood: ${l.mood}\n${l.notes}`;
  const save = async () => {
    if (await run(() => addShiftLog({ data: f }))) setF(empty);
  };
  const copy = async (l: ShiftLog) => {
    await navigator.clipboard.writeText(summary(l)).catch(() => undefined);
    setCopied(l.id);
    window.setTimeout(() => setCopied(null), 2000);
  };
  return (
    <>
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <select aria-label="Patient" className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value })}>
            <option value="">Select patient</option>{placed.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className={inputCls} placeholder="BP (e.g. 120/80)" value={f.bp} onChange={(e) => setF({ ...f, bp: e.target.value })} />
          <input className={inputCls} placeholder="SpO2 %" value={f.spo2} onChange={(e) => setF({ ...f, spo2: e.target.value })} />
          <input className={inputCls} placeholder="Meals & fluids" value={f.meals} onChange={(e) => setF({ ...f, meals: e.target.value })} />
          <input className={inputCls} placeholder="Medicines given" value={f.meds} onChange={(e) => setF({ ...f, meds: e.target.value })} />
          <input className={inputCls} placeholder="Mood" value={f.mood} onChange={(e) => setF({ ...f, mood: e.target.value })} />
        </div>
        <textarea className={`${inputCls} mt-3`} rows={2} placeholder="Mobility, needs observed, notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <button className={`${btnCls} mt-3`} disabled={!f.patientId} onClick={save}>Save shift report</button>
        {placed.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Logs are for placed patients — assign a caregiver on the Patients page first.</p>}
      </Card>
      <div className="mt-6 space-y-4">
        {s.shifts.map((l) => (
          <Card key={l.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg">{name(l.patientId)} <span className="text-sm text-muted-foreground">· {fmt(l.date)} · {s.caregivers.find((c) => c.id === l.caregiverId)?.name}</span></h3>
              <button className="text-sm text-primary underline" onClick={() => copy(l)}>{copied === l.id ? "Copied" : "Copy guardian summary"}</button>
            </div>
            <p className="mt-2 text-sm">BP {l.bp} · SpO2 {l.spo2}% · {l.meals} · {l.meds} · Mood: {l.mood}</p>
            {l.notes && <p className="mt-1 text-sm text-muted-foreground">{l.notes}</p>}
          </Card>
        ))}
      </div>
    </>
  );
}
