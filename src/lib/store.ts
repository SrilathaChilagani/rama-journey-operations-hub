import { useSyncExternalStore } from "react";
import type { Cadre, Severity, Tier } from "./care-rules";

export type Patient = {
  id: string; name: string; age: number; condition: string; guardian: string; guardianPhone: string;
  serviceLine: "Post-hospitalisation" | "Elderly care" | "Rehabilitation";
  journeyStep: number; tier: Tier | null; caregiverId: string | null; backupId: string | null;
  careStart: string | null; lastNurseVisit: string | null;
  pin?: string; preferredCaregiverId?: string; visitAt?: string;
};
export type Caregiver = { id: string; name: string; cadre: Cadre; languages: string; status: "Deployed" | "Bench" | "Training"; area?: string; pin?: string; lat?: number; lng?: number; bio?: string };
export type ShiftLog = { id: string; patientId: string; caregiverId: string; date: string; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string };
export type Incident = { id: string; patientId: string; severity: Severity; kind: string; description: string; at: string; resolved: boolean };
export type Complaint = { id: string; patientId: string; text: string; at: string; acknowledged: boolean; resolved: boolean };
export type State = { patients: Patient[]; caregivers: Caregiver[]; shifts: ShiftLog[]; incidents: Incident[]; complaints: Complaint[] };

const KEY = "rama-cares-v1";
const d = (days: number) => new Date(Date.UTC(2026, 10, 20 + days)).toISOString();

const SEED: State = {
  caregivers: [
    { id: "c1", name: "Lakshmi Devi", cadre: "Senior Caregiver", languages: "Telugu, Hindi", status: "Deployed", area: "Kukatpally", pin: "500072", lat: 17.4849, lng: 78.4138, bio: "Post-surgery recovery and mobility support." },
    { id: "c2", name: "Sister Mary Joseph", cadre: "Registered Nurse", languages: "English, Telugu", status: "Deployed", area: "Secunderabad", pin: "500003", lat: 17.4399, lng: 78.4983, bio: "ICU step-down, wound care and catheter care." },
    { id: "c3", name: "Ayesha Begum", cadre: "Certified Caregiver", languages: "Urdu, Hindi", status: "Bench", area: "Banjara Hills", pin: "500034", lat: 17.4156, lng: 78.4347, bio: "Gentle daily living support and dementia care." },
    { id: "c4", name: "Ravi Kumar", cadre: "Care Companion", languages: "Telugu", status: "Bench", area: "Dilsukhnagar", pin: "500060", lat: 17.3687, lng: 78.5247, bio: "Companionship, walks and medication reminders." },
    { id: "c5", name: "Sister Anitha Rao", cadre: "Registered Nurse", languages: "Telugu, English, Kannada", status: "Bench", area: "Gachibowli", pin: "500032", lat: 17.4401, lng: 78.3489, bio: "Cardiac recovery and palliative nursing." },
    { id: "c6", name: "Suresh Goud", cadre: "Senior Caregiver", languages: "Telugu, Hindi", status: "Bench", area: "Madhapur", pin: "500081", lat: 17.4483, lng: 78.3915, bio: "Stroke rehabilitation and transfers." },
    { id: "c7", name: "Fatima Khan", cadre: "Certified Caregiver", languages: "Urdu, English", status: "Bench", area: "Begumpet", pin: "500016", lat: 17.4447, lng: 78.4664, bio: "Personal care, feeding and hygiene." },
    { id: "c8", name: "Padma Latha", cadre: "Senior Caregiver", languages: "Telugu", status: "Bench", area: "Jubilee Hills", pin: "500033", lat: 17.4326, lng: 78.4071, bio: "Elderly care with diabetes management." },
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
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      // Bring older saved data up to date with new example caregivers and their locations.
      const known = new Map(saved.caregivers.map((c) => [c.id, c]));
      const merged = SEED.caregivers.map((c) => { const k = known.get(c.id); return k ? { ...c, ...k } : c; });
      const extra = saved.caregivers.filter((c) => !SEED.caregivers.some((x) => x.id === c.id));
      state = { ...saved, caregivers: [...merged, ...extra] };
    }
  } catch { /* ignore */ }
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
