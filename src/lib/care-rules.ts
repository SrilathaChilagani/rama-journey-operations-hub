// Business rules taken from the Rama Cares SOP.
export type Tier = "T1" | "T2" | "T3" | "T4";
export type Cadre = "Care Companion" | "Certified Caregiver" | "Senior Caregiver" | "Registered Nurse";
export type Severity = "Red" | "Amber" | "Green";

export const TIERS: Record<Tier, { name: string; staff: string; supervision: string; cycleDays: number }> = {
  T1: { name: "Companion", staff: "Care Companion", supervision: "Nurse visit monthly", cycleDays: 30 },
  T2: { name: "Personal care", staff: "Certified Caregiver", supervision: "Nurse visit fortnightly", cycleDays: 14 },
  T3: { name: "Skilled support", staff: "Senior Caregiver or nurse", supervision: "Nurse visit weekly", cycleDays: 7 },
  T4: { name: "Nursing", staff: "Registered Nurse", supervision: "Nurse lead + doctor on call", cycleDays: 7 },
};

export const CADRE_TIERS: Record<Cadre, Tier[]> = {
  "Care Companion": ["T1"],
  "Certified Caregiver": ["T1", "T2"],
  "Senior Caregiver": ["T1", "T2", "T3"],
  "Registered Nurse": ["T1", "T2", "T3", "T4"],
};

export const JOURNEY = [
  { step: 1, name: "Enquiry", owner: "Client Advisor" },
  { step: 2, name: "Home assessment", owner: "Care Manager" },
  { step: 3, name: "Care plan & quote", owner: "Care Manager, Advisor" },
  { step: 4, name: "Match & introduce", owner: "Rostering desk" },
  { step: 5, name: "Care starts", owner: "Caregiver / nurse" },
  { step: 6, name: "48-hour review", owner: "Care Manager" },
  { step: 7, name: "Ongoing care", owner: "Care Manager" },
  { step: 8, name: "Closure", owner: "Care Manager" },
] as const;

export const SEVERITY: Record<Severity, { action: string; response: string }> = {
  Red: { action: "Call 108, then family, then Care Manager. Stay with patient.", response: "Care Manager on phone at once; Clinical Head informed; guardian updated every 30 min." },
  Amber: { action: "Call Care Manager within 15 minutes. Do not act beyond instructions.", response: "Nurse advises by phone or visits within hours; family and doctor informed." },
  Green: { action: "Note in the log and mention in the daily report.", response: "Care Manager reviews at next routine contact." },
};

/** Step 2 is the control point: no assignment without a completed assessment and a set tier. */
export function canAssignCaregiver(p: { journeyStep: number; tier: Tier | null }): boolean {
  return p.journeyStep >= 3 && p.tier !== null;
}

/** A caregiver may only work tiers their cadre is qualified for. */
export function cadreQualifies(cadre: Cadre, tier: Tier): boolean {
  return CADRE_TIERS[cadre].includes(tier);
}

const DAY = 86_400_000;
/** First nurse visit within 48h of start, then on the tier cycle. */
export function nextNurseVisitDue(tier: Tier, careStart: string, lastVisit: string | null): Date {
  if (!lastVisit) return new Date(new Date(careStart).getTime() + 2 * DAY);
  return new Date(new Date(lastVisit).getTime() + TIERS[tier].cycleDays * DAY);
}

/** Complaints: acknowledge within 2 hours, resolve or plan within 48 hours. */
export function complaintDeadlines(received: string) {
  const t = new Date(received).getTime();
  return { acknowledgeBy: new Date(t + 2 * 3_600_000), resolveBy: new Date(t + 48 * 3_600_000) };
}

/** Why a patient can't move to the next journey step, or null if they can. Same rule in UI and server. */
export function advanceBlockReason(p: { journeyStep: number; tier: Tier | null; caregiverId: string | null }): string | null {
  if (p.journeyStep >= 8) return "The care journey is already closed.";
  if (p.journeyStep === 2 && !p.tier) return "A nurse must set the tier at the home assessment first.";
  if (p.journeyStep === 4 && !p.caregiverId) return "Assign a caregiver before care starts.";
  return null;
}

/** Why this caregiver can't be placed with this patient, or null if they can. */
export function assignmentBlockReason(
  p: { journeyStep: number; tier: Tier | null; caregiverId: string | null },
  c: { id: string; cadre: Cadre },
  role: "caregiver" | "backup",
): string | null {
  if (!canAssignCaregiver(p)) return "Complete the home assessment and set a tier before assigning anyone.";
  if (!cadreQualifies(c.cadre, p.tier!)) return `A ${c.cadre} is not qualified for ${p.tier}.`;
  if (role === "backup" && c.id === p.caregiverId) return "The backup must be a different person from the main caregiver.";
  return null;
}
