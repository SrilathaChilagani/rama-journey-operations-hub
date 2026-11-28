// Server functions for the staff console. Every one requires a signed-in staff session and
// re-checks SOP rules on the server — the browser's checks are only for a friendly UI.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { advanceBlockReason, assignmentBlockReason, cadreQualifies, type Cadre, type Tier } from "@/lib/care-rules";
import { SERVICE_LINES } from "@/lib/enquiry";
import { normalizePhone } from "@/lib/phone";
import type { ConsoleState } from "@/lib/store";
import { requireStaff } from "@/server/auth";
import { query } from "@/server/db";

const id = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const CADRES = ["Care Companion", "Certified Caregiver", "Senior Caregiver", "Registered Nurse"] as const;
const TIER_VALUES = ["T1", "T2", "T3", "T4"] as const;

const iso = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();

type Ts = Date | string | null;
type CaregiverRow = { id: string; name: string; cadre: Cadre; languages: string; status: "Deployed" | "Bench" | "Training" };
type PatientFull = {
  id: string; name: string; age: number; condition: string; guardian_name: string; guardian_phone: string;
  service_line: (typeof SERVICE_LINES)[number]; journey_step: number; tier: Tier | null;
  caregiver_id: string | null; backup_id: string | null; care_start: Ts; last_nurse_visit: Ts;
};
type ShiftRow = { id: string; patient_id: string; caregiver_id: string | null; logged_at: Ts; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string };
type IncidentRow = { id: string; patient_id: string; severity: "Red" | "Amber" | "Green"; kind: string; description: string; occurred_at: Ts; resolved_at: Ts };
type ComplaintRow = { id: string; patient_id: string; text: string; received_at: Ts; acknowledged_at: Ts; resolved_at: Ts; raised_by: string | null };
type ContactRow = { id: string; patient_id: string; name: string; relationship: string; phone: string; consent_at: Ts };

export const getConsole = createServerFn({ method: "GET" }).handler(async (): Promise<ConsoleState> => {
  await requireStaff();
  const [caregivers, patients, shifts, incidents, complaints, contacts] = await Promise.all([
    query<CaregiverRow>(`select id, name, cadre, languages, status from caregivers order by created_at`),
    query<PatientFull>(
      `select id, name, age, condition, guardian_name, guardian_phone, service_line, journey_step, tier,
              caregiver_id, backup_id, care_start, last_nurse_visit
         from patients order by created_at`,
    ),
    query<ShiftRow>(
      `select id, patient_id, caregiver_id, logged_at, bp, spo2, meals, meds, mood, notes
         from shift_logs order by logged_at desc limit 300`,
    ),
    query<IncidentRow>(
      `select id, patient_id, severity, kind, description, occurred_at, resolved_at
         from incidents order by occurred_at desc limit 300`,
    ),
    query<ComplaintRow>(
      `select k.id, k.patient_id, k.text, k.received_at, k.acknowledged_at, k.resolved_at, f.name as raised_by
         from complaints k left join family_contacts f on f.id = k.raised_by_contact
        order by k.received_at desc limit 300`,
    ),
    query<ContactRow>(
      `select id, patient_id, name, relationship, phone, consent_at from family_contacts where active order by created_at`,
    ),
  ]);
  return {
    caregivers,
    patients: patients.map((p) => ({
      id: p.id, name: p.name, age: Number(p.age), condition: p.condition, guardian: p.guardian_name,
      guardianPhone: p.guardian_phone, serviceLine: p.service_line, journeyStep: Number(p.journey_step),
      tier: p.tier, caregiverId: p.caregiver_id, backupId: p.backup_id,
      careStart: iso(p.care_start), lastNurseVisit: iso(p.last_nurse_visit),
    })),
    shifts: shifts.map((l) => ({
      id: l.id, patientId: l.patient_id, caregiverId: l.caregiver_id ?? "", date: iso(l.logged_at)!,
      bp: l.bp, spo2: l.spo2, meals: l.meals, meds: l.meds, mood: l.mood, notes: l.notes,
    })),
    incidents: incidents.map((i) => ({
      id: i.id, patientId: i.patient_id, severity: i.severity, kind: i.kind, description: i.description,
      at: iso(i.occurred_at)!, resolved: i.resolved_at != null,
    })),
    complaints: complaints.map((k) => ({
      id: k.id, patientId: k.patient_id, text: k.text, at: iso(k.received_at)!,
      acknowledged: k.acknowledged_at != null, resolved: k.resolved_at != null,
      acknowledgedAt: iso(k.acknowledged_at), resolvedAt: iso(k.resolved_at), raisedBy: k.raised_by,
    })),
    familyContacts: contacts.map((f) => ({
      id: f.id, patientId: f.patient_id, name: f.name, relationship: f.relationship, phone: f.phone,
      consentAt: iso(f.consent_at),
    })),
  };
});

// ---- Caregivers ----
export const addCaregiver = createServerFn({ method: "POST" })
  .validator(z.object({ name: text(100).min(1), cadre: z.enum(CADRES), languages: text(200) }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    await query(`insert into caregivers (name, cadre, languages, created_by) values ($1, $2, $3, $4)`,
      [data.name, data.cadre, data.languages, staff.id]);
  });

export const setCaregiverStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id, status: z.enum(["Training", "Bench", "Deployed"]) }))
  .handler(async ({ data }) => {
    await requireStaff();
    await query(`update caregivers set status = $2 where id = $1`, [data.id, data.status]);
  });

// ---- Patients ----
type PatientRow = { id: string; journey_step: number; tier: Tier | null; caregiver_id: string | null; care_start: unknown };

async function loadPatient(patientId: string) {
  const [p] = await query<PatientRow>(
    `select id, journey_step, tier, caregiver_id, care_start from patients where id = $1`, [patientId]);
  if (!p) throw new Error("That patient no longer exists. Refresh the page.");
  return { ...p, rule: { journeyStep: p.journey_step, tier: p.tier, caregiverId: p.caregiver_id } };
}

export const addPatient = createServerFn({ method: "POST" })
  .validator(z.object({
    name: text(100).min(1), age: z.string().trim().regex(/^\d{0,3}$/).default(""), condition: text(500),
    guardian: text(100), guardianPhone: text(30), serviceLine: z.enum(SERVICE_LINES), enquiryId: id.optional(),
  }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    await query(
      `insert into patients (name, age, condition, guardian_name, guardian_phone, service_line, enquiry_id, created_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [data.name, Number(data.age) || 0, data.condition, data.guardian, data.guardianPhone, data.serviceLine,
        data.enquiryId ?? null, staff.id],
    );
    if (data.enquiryId) {
      await query(`update enquiries set status = 'closed', updated_at = now() where id = $1`, [data.enquiryId]);
    }
  });

export const setPatientTier = createServerFn({ method: "POST" })
  .validator(z.object({ id, tier: z.enum(TIER_VALUES).nullable() }))
  .handler(async ({ data }) => {
    await requireStaff();
    const p = await loadPatient(data.id);
    if (p.journey_step < 2) throw new Error("The tier is set by a nurse at the home assessment (step 2).");
    // A tier change can make the current placement unqualified — drop anyone who no longer fits
    // (rule from care-rules.ts, not re-stated here).
    const placed = await query<{ id: string; cadre: Cadre }>(
      `select c.id, c.cadre from caregivers c join patients p on c.id in (p.caregiver_id, p.backup_id) where p.id = $1`,
      [data.id],
    );
    const stillFits = (cid: string | null) => {
      const c = placed.find((x) => x.id === cid);
      return !!(c && data.tier && cadreQualifies(c.cadre, data.tier));
    };
    const [row] = await query<{ caregiver_id: string | null; backup_id: string | null }>(
      `select caregiver_id, backup_id from patients where id = $1`, [data.id]);
    await query(
      `update patients set tier = $2, caregiver_id = $3, backup_id = $4, updated_at = now() where id = $1`,
      [data.id, data.tier, stillFits(row?.caregiver_id ?? null) ? row!.caregiver_id : null,
        stillFits(row?.backup_id ?? null) ? row!.backup_id : null],
    );
  });

export const assignCaregiver = createServerFn({ method: "POST" })
  .validator(z.object({ id, caregiverId: id.nullable(), role: z.enum(["caregiver", "backup"]) }))
  .handler(async ({ data }) => {
    await requireStaff();
    const p = await loadPatient(data.id);
    const column = data.role === "caregiver" ? "caregiver_id" : "backup_id";
    if (data.caregiverId) {
      const [c] = await query<{ id: string; cadre: Cadre }>(`select id, cadre from caregivers where id = $1`, [data.caregiverId]);
      if (!c) throw new Error("That caregiver no longer exists. Refresh the page.");
      const reason = assignmentBlockReason(p.rule, c, data.role);
      if (reason) throw new Error(reason);
    }
    // A new main caregiver who was the backup stops being the backup.
    await query(
      `update patients set ${column} = $2, updated_at = now()
              ${data.role === "caregiver" ? ", backup_id = case when backup_id = $2 then null else backup_id end" : ""}
        where id = $1`,
      [data.id, data.caregiverId],
    );
  });

export const advancePatient = createServerFn({ method: "POST" })
  .validator(z.object({ id }))
  .handler(async ({ data }) => {
    await requireStaff();
    const p = await loadPatient(data.id);
    const reason = advanceBlockReason(p.rule);
    if (reason) throw new Error(reason);
    await query(
      `update patients set journey_step = journey_step + 1, updated_at = now(),
              care_start = case when journey_step = 4 then now() else care_start end
        where id = $1 and journey_step = $2`,
      [data.id, p.journey_step],
    );
  });

export const logNurseVisit = createServerFn({ method: "POST" })
  .validator(z.object({ id }))
  .handler(async ({ data }) => {
    await requireStaff();
    const p = await loadPatient(data.id);
    if (!p.care_start) throw new Error("Nurse supervision visits start once care has begun.");
    await query(`update patients set last_nurse_visit = now(), updated_at = now() where id = $1`, [data.id]);
  });

// ---- Daily care log ----
export const addShiftLog = createServerFn({ method: "POST" })
  .validator(z.object({
    patientId: id, bp: text(20), spo2: text(10), meals: text(300), meds: text(300), mood: text(100), notes: text(2000),
  }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    const p = await loadPatient(data.patientId);
    if (!p.caregiver_id) throw new Error("Only placed patients (with a caregiver) have daily care logs.");
    await query(
      `insert into shift_logs (patient_id, caregiver_id, bp, spo2, meals, meds, mood, notes, recorded_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [data.patientId, p.caregiver_id, data.bp, data.spo2, data.meals, data.meds, data.mood, data.notes, staff.id],
    );
  });

// ---- Incidents ----
export const addIncident = createServerFn({ method: "POST" })
  .validator(z.object({ patientId: id, severity: z.enum(["Red", "Amber", "Green"]), kind: text(100).min(1), description: text(2000) }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    await loadPatient(data.patientId);
    await query(
      `insert into incidents (patient_id, severity, kind, description, reported_by) values ($1, $2, $3, $4, $5)`,
      [data.patientId, data.severity, data.kind, data.description, staff.id],
    );
  });

export const setIncidentResolved = createServerFn({ method: "POST" })
  .validator(z.object({ id, resolved: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStaff();
    await query(`update incidents set resolved_at = case when $2 then now() else null end where id = $1`, [data.id, data.resolved]);
  });

// ---- Complaints ----
export const addComplaint = createServerFn({ method: "POST" })
  .validator(z.object({ patientId: id, text: text(2000).min(1) }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    await loadPatient(data.patientId);
    await query(`insert into complaints (patient_id, text, logged_by) values ($1, $2, $3)`, [data.patientId, data.text, staff.id]);
  });

export const setComplaintState = createServerFn({ method: "POST" })
  .validator(z.object({ id, field: z.enum(["acknowledged", "resolved"]), value: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStaff();
    const column = data.field === "acknowledged" ? "acknowledged_at" : "resolved_at";
    await query(`update complaints set ${column} = case when $2 then coalesce(${column}, now()) else null end where id = $1`,
      [data.id, data.value]);
  });

// ---- Family portal access ----
export const addFamilyContact = createServerFn({ method: "POST" })
  .validator(z.object({ patientId: id, name: text(100).min(1), relationship: text(50), phone: text(30).min(6) }))
  .handler(async ({ data }) => {
    const staff = await requireStaff();
    await loadPatient(data.patientId);
    const phone = normalizePhone(data.phone);
    if (!phone) throw new Error("Enter the mobile number with its country code, e.g. +1 408 555 0142 (Indian numbers can skip +91).");
    await query(
      `insert into family_contacts (patient_id, name, relationship, phone, created_by) values ($1, $2, $3, $4, $5)
       on conflict (patient_id, phone) do update set name = excluded.name, relationship = excluded.relationship, active = true`,
      [data.patientId, data.name, data.relationship, phone, staff.id],
    );
  });

export const removeFamilyContact = createServerFn({ method: "POST" })
  .validator(z.object({ id }))
  .handler(async ({ data }) => {
    await requireStaff();
    // Kept (inactive) so concerns they raised stay attributed; access ends on their next request.
    await query(`update family_contacts set active = false where id = $1`, [data.id]);
  });
