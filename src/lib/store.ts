// Console data, shared through the Rama Cares database (was per-browser localStorage).
// AppShell calls loadConsole() once a staff member is signed in; pages read with useStore()
// (null while loading) and change data with run(serverFn) — the server checks every SOP rule,
// then the console reloads so every page shows the saved state.
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
export type Complaint = {
  id: string; patientId: string; text: string; at: string; acknowledged: boolean; resolved: boolean;
  acknowledgedAt: string | null; resolvedAt: string | null;
};
export type ConsoleState = { patients: Patient[]; caregivers: Caregiver[]; shifts: ShiftLog[]; incidents: Incident[]; complaints: Complaint[] };
/** @deprecated name kept for older imports */
export type State = ConsoleState;

type Snapshot = { data: ConsoleState | null; error: string | null; busy: boolean };
let snap: Snapshot = { data: null, error: null, busy: false };
let fetcher: (() => Promise<ConsoleState>) | null = null;
const listeners = new Set<() => void>();
const set = (p: Partial<Snapshot>) => {
  snap = { ...snap, ...p };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export async function loadConsole(fetch?: () => Promise<ConsoleState>) {
  if (fetch) fetcher = fetch;
  if (!fetcher) return;
  try {
    set({ data: await fetcher(), error: null });
  } catch {
    set({ error: "Couldn't load console data. Check your connection and refresh." });
  }
}

export function clearConsole() {
  set({ data: null, error: null, busy: false });
}

/** Run a server change, show its error (e.g. an SOP rule) if refused, then reload. */
export async function run(change: () => Promise<unknown>): Promise<boolean> {
  set({ busy: true, error: null });
  try {
    await change();
    await loadConsole();
    return true;
  } catch (e) {
    set({ error: e instanceof Error && e.message ? e.message : "That change couldn't be saved." });
    return false;
  } finally {
    set({ busy: false });
  }
}

export function dismissError() {
  set({ error: null });
}

const SERVER: Snapshot = { data: null, error: null, busy: false };
export function useConsoleStatus(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => SERVER);
}

/** Console data, or null until it has loaded (after sign-in). */
export function useStore(): ConsoleState | null {
  return useConsoleStatus().data;
}

export const fmt = (iso: string | Date) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
