import { describe, expect, it } from "vitest";
import { distanceKm, findArea, openSlots } from "./areas";

describe("areas", () => {
  it("finds an area by PIN code or name", () => {
    expect(findArea("500032")?.name).toBe("Gachibowli");
    expect(findArea("kuk")?.pin).toBe("500072");
    expect(findArea("nowhere")).toBeNull();
  });
  it("measures distance between areas", () => {
    const d = distanceKm({ lat: 17.4401, lng: 78.3489 }, { lat: 17.4399, lng: 78.4983 });
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(17);
  });
  it("hides slots that are already booked", () => {
    const from = new Date(2026, 10, 23);
    const all = openSlots(from, []);
    expect(all).toHaveLength(20);
    expect(openSlots(from, [all[0]!.toISOString()])).toHaveLength(19);
  });
});
