import { describe, expect, it } from "vitest";
import { getWeeklyPhotoIndex, HOME_PHOTOS, PHOTO_WEEK_MS } from "./home-photos";

describe("Weekly homepage photos", () => {
  it("contains at least 10 distinct photos", () => {
    expect(HOME_PHOTOS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(HOME_PHOTOS.map((photo) => photo.src)).size).toBe(10);
  });

  it("keeps the same photo throughout a week and changes every Monday in India", () => {
    expect(getWeeklyPhotoIndex(new Date("2026-11-23T00:00:00+05:30"))).toBe(0);
    expect(getWeeklyPhotoIndex(new Date("2026-11-29T23:59:59.999+05:30"))).toBe(0);
    expect(getWeeklyPhotoIndex(new Date("2026-11-30T00:00:00+05:30"))).toBe(1);
    expect(getWeeklyPhotoIndex(new Date("2026-12-07T00:00:00+05:30"))).toBe(2);
  });

  it("visits all ten photos before repeating the collection", () => {
    const start = Date.parse("2026-11-23T00:00:00+05:30");
    const indices = Array.from({ length: 10 }, (_, week) => getWeeklyPhotoIndex(new Date(start + week * PHOTO_WEEK_MS)));
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(getWeeklyPhotoIndex(new Date(start + 10 * PHOTO_WEEK_MS))).toBe(0);
  });
});