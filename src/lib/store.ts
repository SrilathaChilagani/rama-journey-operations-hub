import { useSyncExternalStore } from "react";
import type { Cadre, Severity, Tier } from "./care-rules";

export type Patient = {
  id: string; name: string; age: number; condition: string; guardian: string; guardianPhone: string;
  serviceLine: "Post-hospitalisation" | "Elderly care" | "Rehabilitation";
  journeyStep: number; tier: Tier | null; caregiverId: string | null; backupId: string | null;
  careStart: string | null; lastNurseVisit: string | null;
};
export type Caregiver = { id: string; name: string; cadre: Cadre; languages: string; status: "Deployed" | "Bench" | "Training" };
export type ShiftLog = { id: string; patientId: string; caregiverId: string; date: string; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string };
export type Incident = { id: string; patientId: string; severity: Severity; kind: string; description: string; at: string; resolved: boolean };
export type Complaint = { id: string; patientId: string; text: string; at: string; acknowledged: boolean; resolved: boolean };
export type State = { patients: Patient[]; caregivers: Caregiver[]; shifts: ShiftLog[]; incidents: Incident[]; complaints: Complaint[] };

const KEY = "rama-cares-v1";
const d = (days: number) => new Date(Date.UTC(2026, 10, 20 + days)).toISOString();

const SEED: State = {
  caregivers: [
    { id: "c1", name: "Lakshmi Devi", cadre: "Senior Caregiver", languages: "Telugu, Hindi", status: "Deployed" },
    { id: "c2", name: "Sister Mary Joseph", cadre: "Registered Nurse", languages: "English, Telugu", status: "Deployed" },
    { id: "c3", name: "Ayesha Begum", cadre: "Certified Caregiver", languages: "Urdu, Hindi", status: "Bench" },
    { id: "c4", name: "Ravi Kumar", cadre: "Care Companion", languages: "Telugu", status: "Bench" },
  ],
  patients: [
    { id: "p1", name: "Venkata Rao", age: 78, condition: "Post knee replacement", guardian: "Srinivas (USA)", guardianPhone: "+1 408 555 0142", serviceLine: "Post-hospitalisation", journeyStep: 7, tier: "T3", caregiverId: "c1", backupId: null, careStart: d(-10), lastNurseVisit: d(-8) },
    { id: "p2", name: "Kamala Reddy", age: 84, condition: "Dementia, bedridden", guardian: "Priya (Bengaluru)", guardianPhone: "+91 98480 11223", serviceLine: "Elderly care", journeyStep: 6, tier: "T4", caregiverId: "c2", backupId: null, careStart: d(-1), lastNurseVisit: null },
    { id: "p3", name: "Mohammed Ismail", age: 70, condition: "Stroke recovery", guardian: "Farhan (Dubai)", guardianPhone: "+971 50 555 0199", serviceLine: "Rehabilitation", journeyStep: 2, tier: null, caregiverId: null, backupId: null, careStart: null, lastNurseVisit: null },
  ],
  shifts: [{ id: "s1", patientId: "p1", caregiverId: "c1", date: d(1), bp: "132/84", spo2: "97", meals: "3 meals, 1.5L fluids", meds: "All given on time", mood: "Cheerful", notes: "Walked 20 m with walker." }],
  incidents: [{ id: "i1", patientId: "p2", severity: "Amber", kind: "Wound change", description: "Redness at sacrum, Care Manager called.", at: d(1), resolved: false }],
  complaints: [],
};

let state: State = SEED;
let loaded = false;
const listeners = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw) as State; } catch { /* ignore */ }
}
export function update(fn: (s: State) => State) {
  load();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
export function resetDemo() { update(() => SEED); }
export function useStore(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => SEED,
  );
}
export const uid = () => Math.random().toString(36).slice(2, 9);
export const fmt = (iso: string | Date) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
