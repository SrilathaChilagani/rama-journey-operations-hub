import { describe, expect, it } from "vitest";
import { advanceBlockReason, assignmentBlockReason, cadreQualifies, canAssignCaregiver, complaintDeadlines, nextNurseVisitDue } from "./care-rules";

describe("Rama Cares SOP rules", () => {
  it("blocks assignment before assessment is complete", () => {
    expect(canAssignCaregiver({ journeyStep: 2, tier: null })).toBe(false);
    expect(canAssignCaregiver({ journeyStep: 3, tier: "T2" })).toBe(true);
  });
  it("does not let a Care Companion work T3", () => {
    expect(cadreQualifies("Care Companion", "T3")).toBe(false);
    expect(cadreQualifies("Registered Nurse", "T4")).toBe(true);
  });
  it("first nurse visit is due 48h after start, then weekly for T3", () => {
    expect(nextNurseVisitDue("T3", "2026-01-01T00:00:00Z", null).toISOString()).toBe("2026-01-03T00:00:00.000Z");
    expect(nextNurseVisitDue("T3", "2026-01-01T00:00:00Z", "2026-01-03T00:00:00Z").toISOString()).toBe("2026-01-10T00:00:00.000Z");
  });
  it("complaints: acknowledge in 2h, resolve in 48h", () => {
    const d = complaintDeadlines("2026-01-01T00:00:00Z");
    expect(d.acknowledgeBy.toISOString()).toBe("2026-01-01T02:00:00.000Z");
    expect(d.resolveBy.toISOString()).toBe("2026-01-03T00:00:00.000Z");
  });
  it("journey can't skip the assessment tier or start care without a caregiver", () => {
    expect(advanceBlockReason({ journeyStep: 1, tier: null, caregiverId: null })).toBeNull();
    expect(advanceBlockReason({ journeyStep: 2, tier: null, caregiverId: null })).toMatch(/tier/);
    expect(advanceBlockReason({ journeyStep: 2, tier: "T2", caregiverId: null })).toBeNull();
    expect(advanceBlockReason({ journeyStep: 4, tier: "T2", caregiverId: null })).toMatch(/caregiver/);
    expect(advanceBlockReason({ journeyStep: 8, tier: "T2", caregiverId: "c" })).toMatch(/closed/);
  });
  it("assignment checks gate, cadre and a distinct backup", () => {
    const rn = { id: "c1", cadre: "Registered Nurse" as const };
    const cc = { id: "c2", cadre: "Care Companion" as const };
    expect(assignmentBlockReason({ journeyStep: 2, tier: "T1", caregiverId: null }, rn, "caregiver")).toMatch(/assessment/);
    expect(assignmentBlockReason({ journeyStep: 3, tier: "T3", caregiverId: null }, cc, "caregiver")).toMatch(/not qualified/);
    expect(assignmentBlockReason({ journeyStep: 3, tier: "T3", caregiverId: null }, rn, "caregiver")).toBeNull();
    expect(assignmentBlockReason({ journeyStep: 3, tier: "T3", caregiverId: "c1" }, rn, "backup")).toMatch(/different/);
  });
});
