import { describe, expect, it } from "vitest";
import { cadreQualifies, canAssignCaregiver, complaintDeadlines, nextNurseVisitDue } from "./care-rules";

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
});
