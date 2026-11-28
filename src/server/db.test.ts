import { describe, expect, it } from "vitest";
import { cleanParam } from "./db";

describe("db params", () => {
  it("drops NUL characters Postgres can't store, leaving other values alone", () => {
    expect(cleanParam("Lak\u0000shmi")).toBe("Lakshmi");
    expect(cleanParam(42)).toBe(42);
    expect(cleanParam(null)).toBeNull();
  });
});
