// Server functions for the family portal. Every data read is scoped on the server to patients
// the signed-in family member is linked to — a patient id from the browser is only a choice
// among those, never trusted on its own.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Cadre, Severity, Tier } from "@/lib/care-rules";
import { normalizePhone } from "@/lib/phone";
import {
  familyLinks, familyLogout, recordFamilyConsent, requireFamilyAccess, resendFamilyCode,
  startFamilyLogin, verifyFamilyCode,
} from "@/server/family-auth";
import { query } from "@/server/db";
import { concernAlert } from "@/lib/notify-messages";
import { baseUrl, notifyStaff } from "@/server/notify";

export type { FamilyLink } from "@/server/family-auth";

export const familyStart = createServerFn({ method: "POST" })
  .validator(z.object({ phone: z.string().trim().min(6).max(30) }))
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    if (!phone) return { status: "error" as const, reason: "bad-number" as const };
    return startFamilyLogin(phone);
  });

export const familyVerify = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().regex(/^\d{4,10}$/) }))
  .handler(async ({ data }) => verifyFamilyCode(data.code));

export const familyResend = createServerFn({ method: "POST" }).handler(async () => resendFamilyCode());

export const familyMe = createServerFn({ method: "GET" }).handler(async () => familyLinks());

export const familyConsent = createServerFn({ method: "POST" }).handler(async () => {
  await recordFamilyConsent();
  return { ok: true as const };
});

export const familySignOut = createServerFn({ method: "POST" }).handler(async () => {
  await familyLogout();
  return { ok: true as const };
});

const iso = (v: Date | string | null): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
type Ts = Date | string | null;

export type FamilyView = {
  patient: {
    name: string; age: number; serviceLine: string; journeyStep: number; tier: Tier | null;
    careStart: string | null; lastNurseVisit: string | null;
  };
  caregiver: { name: string; cadre: Cadre; languages: string } | null;
  backup: { name: string; cadre: Cadre; languages: string } | null;
  logs: { id: string; date: string; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string; caregiver: string | null }[];
  incidents: { id: string; severity: Severity; kind: string; at: string; resolved: boolean }[];
  concerns: { id: string; text: string; at: string; acknowledgedAt: string | null; resolvedAt: string | null; raisedBy: string }[];
  prefs: { daily: boolean; incidents: boolean };
};

export const familyView = createServerFn({ method: "GET" })
  .validator(z.object({ patientId: z.string().uuid() }))
  .handler(async ({ data }): Promise<FamilyView> => {
    const link = await requireFamilyAccess(data.patientId);
    const [prefs] = await query<{ daily: boolean; incidents: boolean }>(
      `select notify_daily as daily, notify_incidents as incidents from family_contacts where id = $1`, [link.contactId]);
    type P = { name: string; age: number; service_line: string; journey_step: number; tier: Tier | null; care_start: Ts; last_nurse_visit: Ts; caregiver_id: string | null; backup_id: string | null };
    const [p] = await query<P>(
      `select name, age, service_line, journey_step, tier, care_start, last_nurse_visit, caregiver_id, backup_id
         from patients where id = $1`, [data.patientId]);
    if (!p) throw new Error("Not signed in");
    const team = await query<{ id: string; name: string; cadre: Cadre; languages: string }>(
      `select id, name, cadre, languages from caregivers where id = any($1::uuid[])`,
      [[p.caregiver_id, p.backup_id].filter(Boolean)]);
    const person = (cid: string | null) => {
      const c = team.find((t) => t.id === cid);
      return c ? { name: c.name, cadre: c.cadre, languages: c.languages } : null;
    };
    const [logs, incidents, concerns] = await Promise.all([
      query<{ id: string; logged_at: Ts; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string; caregiver: string | null }>(
        `select s.id, s.logged_at, s.bp, s.spo2, s.meals, s.meds, s.mood, s.notes, c.name as caregiver
           from shift_logs s left join caregivers c on c.id = s.caregiver_id
          where s.patient_id = $1 order by s.logged_at desc limit 60`, [data.patientId]),
      // Families see what happened and its status; staff-only notes (description) stay internal.
      query<{ id: string; severity: Severity; kind: string; occurred_at: Ts; resolved_at: Ts }>(
        `select id, severity, kind, occurred_at, resolved_at from incidents
          where patient_id = $1 order by occurred_at desc limit 60`, [data.patientId]),
      query<{ id: string; text: string; received_at: Ts; acknowledged_at: Ts; resolved_at: Ts; raised_by: string }>(
        `select k.id, k.text, k.received_at, k.acknowledged_at, k.resolved_at, f.name as raised_by
           from complaints k join family_contacts f on f.id = k.raised_by_contact
          where k.patient_id = $1 order by k.received_at desc limit 60`, [data.patientId]),
    ]);
    return {
      patient: {
        name: p.name, age: Number(p.age), serviceLine: p.service_line, journeyStep: Number(p.journey_step),
        tier: p.tier, careStart: iso(p.care_start), lastNurseVisit: iso(p.last_nurse_visit),
      },
      caregiver: person(p.caregiver_id),
      backup: person(p.backup_id),
      logs: logs.map((l) => ({ id: l.id, date: iso(l.logged_at)!, bp: l.bp, spo2: l.spo2, meals: l.meals, meds: l.meds, mood: l.mood, notes: l.notes, caregiver: l.caregiver })),
      incidents: incidents.map((i) => ({ id: i.id, severity: i.severity, kind: i.kind, at: iso(i.occurred_at)!, resolved: i.resolved_at != null })),
      concerns: concerns.map((k) => ({ id: k.id, text: k.text, at: iso(k.received_at)!, acknowledgedAt: iso(k.acknowledged_at), resolvedAt: iso(k.resolved_at), raisedBy: k.raised_by })),
      prefs: prefs ?? { daily: true, incidents: true },
    };
  });

export const familyRaiseConcern = createServerFn({ method: "POST" })
  .validator(z.object({ patientId: z.string().uuid(), text: z.string().trim().min(3).max(2000) }))
  .handler(async ({ data }) => {
    const link = await requireFamilyAccess(data.patientId);
    await query(`insert into complaints (patient_id, text, raised_by_contact) values ($1, $2, $3)`,
      [data.patientId, data.text, link.contactId]);
    await notifyStaff("concern_new", concernAlert({ patientName: link.patientName, raisedBy: link.contactName, text: data.text }, baseUrl()), data.patientId);
    return { ok: true as const };
  });

export const familySetPrefs = createServerFn({ method: "POST" })
  .validator(z.object({ patientId: z.string().uuid(), daily: z.boolean(), incidents: z.boolean() }))
  .handler(async ({ data }) => {
    const link = await requireFamilyAccess(data.patientId);
    await query(`update family_contacts set notify_daily = $2, notify_incidents = $3 where id = $1`,
      [link.contactId, data.daily, data.incidents]);
    return { ok: true as const };
  });
