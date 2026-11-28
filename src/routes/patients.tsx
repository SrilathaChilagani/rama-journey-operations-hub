import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls } from "@/components/rc/AppShell";
import { JOURNEY, TIERS, advanceBlockReason, cadreQualifies, canAssignCaregiver, type Tier } from "@/lib/care-rules";
import { addFamilyContact, addPatient, advancePatient, assignCaregiver, logNurseVisit, removeFamilyContact, setPatientTier } from "@/lib/api/console";
import { SERVICE_LINES } from "@/lib/enquiry";
import { type Patient, fmt, run, useStore } from "@/lib/store";

export const Route = createFileRoute("/patients")({
  head: head("Patients", "Patients moving through the Rama Cares 8-step client journey."),
  component: () => (
    <AppShell title="Patients" subtitle="A nurse sets the tier at assessment — never the sales conversation. No caregiver can be assigned until step 2 is complete.">
      <Patients />
    </AppShell>
  ),
});

const blank = { name: "", age: "", condition: "", guardian: "", guardianPhone: "", serviceLine: "Post-hospitalisation" as Patient["serviceLine"] };

function Patients() {
  const s = useStore()!;
  const [f, setF] = useState(blank);
  const add = async () => {
    if (!f.name.trim()) return;
    if (await run(() => addPatient({ data: f }))) setF({ ...blank, serviceLine: f.serviceLine });
  };
  return (
    <>
      <Card>
        <h2 className="font-display text-xl">New enquiry</h2>
        <p className="mt-1 text-xs text-muted-foreground">Website enquiries can be turned into patients from the Enquiries page.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className={inputCls} placeholder="Patient name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={inputCls} placeholder="Age" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <input className={inputCls} placeholder="Condition / hospital" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} />
          <input className={inputCls} placeholder="Guardian (decision-maker)" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} />
          <input className={inputCls} placeholder="Guardian phone / WhatsApp" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} />
          <select aria-label="Service" className={inputCls} value={f.serviceLine} onChange={(e) => setF({ ...f, serviceLine: e.target.value as Patient["serviceLine"] })}>
            {SERVICE_LINES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <button className={`${btnCls} mt-4`} disabled={!f.name.trim()} onClick={add}>Record enquiry</button>
      </Card>
      {s.patients.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No patients yet.</p>}
      <div className="mt-6 space-y-4">
        {s.patients.map((p) => <PatientCard key={p.id} p={p} />)}
      </div>
    </>
  );
}

function PatientCard({ p }: { p: Patient }) {
  const s = useStore()!;
  const assignable = canAssignCaregiver(p);
  const eligible = s.caregivers.filter((c) => p.tier && cadreQualifies(c.cadre, p.tier));
  const blocked = advanceBlockReason(p);
  const assign = (role: "caregiver" | "backup", caregiverId: string) =>
    run(() => assignCaregiver({ data: { id: p.id, caregiverId: caregiverId || null, role } }));
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl">{p.name}{p.age ? `, ${p.age}` : ""}</h3>
          <p className="text-sm text-muted-foreground">{[p.condition, p.serviceLine, p.guardian && `Guardian: ${p.guardian} ${p.guardianPhone}`].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.tier ? <Badge tone="primary">{p.tier} {TIERS[p.tier].name}</Badge> : <Badge>No tier yet</Badge>}
          <Badge>Step {p.journeyStep}: {JOURNEY[p.journeyStep - 1]?.name}</Badge>
        </div>
      </div>
      <div className="mt-4 flex gap-1">
        {JOURNEY.map((j) => <div key={j.step} title={j.name} className={`h-1.5 flex-1 rounded-full ${j.step <= p.journeyStep ? "bg-primary" : "bg-muted"}`} />)}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-xs text-muted-foreground">Tier (set by nurse)
          <select disabled={p.journeyStep < 2} className={inputCls} value={p.tier ?? ""}
            onChange={(e) => run(() => setPatientTier({ data: { id: p.id, tier: (e.target.value || null) as Tier | null } }))}>
            <option value="">—</option>
            {(Object.keys(TIERS) as Tier[]).map((t) => <option key={t} value={t}>{t} {TIERS[t].name}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Caregiver
          <select disabled={!assignable} className={inputCls} value={p.caregiverId ?? ""} onChange={(e) => assign("caregiver", e.target.value)}>
            <option value="">—</option>{eligible.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.cadre})</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Named backup
          <select disabled={!assignable} className={inputCls} value={p.backupId ?? ""} onChange={(e) => assign("backup", e.target.value)}>
            <option value="">—</option>{eligible.filter((c) => c.id !== p.caregiverId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className={btnCls} disabled={!!blocked} title={blocked ?? undefined} onClick={() => run(() => advancePatient({ data: { id: p.id } }))}>
            Advance
          </button>
          {p.careStart && <button className="rounded-md border border-input px-3 py-2 text-sm" onClick={() => run(() => logNurseVisit({ data: { id: p.id } }))}>Log nurse visit</button>}
        </div>
      </div>
      {p.journeyStep < 2 && <p className="mt-3 text-xs text-muted-foreground">Advance to the home assessment (step 2) to set a tier.</p>}
      {p.journeyStep >= 2 && !assignable && <p className="mt-3 text-xs text-muted-foreground">Complete the home assessment and set a tier to unlock caregiver assignment.</p>}
      {blocked && p.journeyStep < 8 && assignable && <p className="mt-3 text-xs text-muted-foreground">{blocked}</p>}
      {p.tier && <p className="mt-2 text-xs text-muted-foreground">Supervision: {TIERS[p.tier].supervision}. Staff grade: {TIERS[p.tier].staff}.{p.careStart && ` Care started ${fmt(p.careStart)}.`}{p.lastNurseVisit && ` Last nurse visit ${fmt(p.lastNurseVisit)}.`}</p>}
      <FamilyAccess p={p} />
    </Card>
  );
}

// Who can sign in to the family portal (/family) for this patient, by mobile number + SMS code.
function FamilyAccess({ p }: { p: Patient }) {
  const s = useStore()!;
  const contacts = s.familyContacts.filter((f) => f.patientId === p.id);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: p.guardian, relationship: "", phone: p.guardianPhone });
  const add = async () => {
    if (await run(() => addFamilyContact({ data: { patientId: p.id, ...f } }))) {
      setF({ name: "", relationship: "", phone: "" });
      setOpen(false);
    }
  };
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium">Family portal access</h4>
        {!open && <button className="text-xs text-primary underline" onClick={() => setOpen(true)}>Add family member</button>}
      </div>
      {contacts.length === 0 && !open && <p className="mt-1 text-xs text-muted-foreground">No one can see this patient in the family portal yet.</p>}
      <ul className="mt-2 space-y-1">
        {contacts.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{c.name}{c.relationship && ` (${c.relationship})`} · {c.phone} · <span className="text-xs text-muted-foreground">{c.consentAt ? `signed in, consented ${fmt(c.consentAt)}` : "not signed in yet"}</span></span>
            <button className="text-xs text-muted-foreground underline" onClick={() => run(() => removeFamilyContact({ data: { id: c.id } }))}>Remove access</button>
          </li>
        ))}
      </ul>
      {open && (
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input className={inputCls} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={inputCls} placeholder="Relationship (e.g. Son)" value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })} />
          <input className={inputCls} placeholder="Mobile, e.g. +1 408 555 0142" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <div className="flex gap-2">
            <button className={btnCls} disabled={!f.name.trim() || !f.phone.trim()} onClick={add}>Give access</button>
            <button className="text-xs text-muted-foreground underline" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-4">They sign in at /family with this number and an SMS code. They see this patient's care team, daily reports, nurse visits and incident status, and can raise a concern.</p>
        </div>
      )}
    </div>
  );
}
