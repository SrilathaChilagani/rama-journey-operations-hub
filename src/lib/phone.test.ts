import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("accepts Indian mobiles with or without +91 / leading 0", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizePhone("098765 43210")).toBe("+919876543210");
  });
  it("accepts international numbers written with + or 00", () => {
    expect(normalizePhone("+1 (408) 555-0142")).toBe("+14085550142");
    expect(normalizePhone("00971 50 555 0199")).toBe("+971505550199");
  });
  it("rejects numbers it can't place", () => {
    expect(normalizePhone("4085550142")).toBeNull(); // US without +1 is ambiguous
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
  });
});
