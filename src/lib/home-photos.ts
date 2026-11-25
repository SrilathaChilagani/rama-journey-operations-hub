import first from "@/assets/rama-home-modern.jpg.asset.json";
import second from "@/assets/rama-care-02.jpg.asset.json";
import third from "@/assets/rama-care-03.jpg.asset.json";
import fourth from "@/assets/rama-care-04.jpg.asset.json";
import fifth from "@/assets/rama-care-05.jpg.asset.json";
import sixth from "@/assets/rama-care-06.jpg.asset.json";
import seventh from "@/assets/rama-care-07.jpg.asset.json";
import eighth from "@/assets/rama-care-08.jpg.asset.json";
import ninth from "@/assets/rama-care-09.jpg.asset.json";
import tenth from "@/assets/rama-care-10.jpg.asset.json";

export const HOME_PHOTOS = [
  { src: first.url, alt: "A nurse gently holding an elderly woman's hand in a bright Hyderabad home" },
  { src: second.url, alt: "A home nurse checking an elderly man's blood pressure" },
  { src: third.url, alt: "A caregiver and an elderly woman enjoying a book together at home" },
  { src: fourth.url, alt: "A physiotherapist supporting an elderly man's arm mobility exercise" },
  { src: fifth.url, alt: "A caregiver supporting an elderly woman seated in a wheelchair at home" },
  { src: sixth.url, alt: "A nurse discussing a care plan with an elderly couple" },
  { src: seventh.url, alt: "A caregiver offering a glass of water to an elderly man" },
  { src: eighth.url, alt: "A nurse helping an elderly woman connect with family on a tablet" },
  { src: ninth.url, alt: "A nurse checking an elderly woman's oxygen level with a fingertip monitor" },
  { src: tenth.url, alt: "A caregiver sharing a moment with an elderly man and a small plant" },
] as const;

export const PHOTO_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Monday, 23 November 2026 at 00:00 India time. Each Monday advances one photo.
const ROTATION_START = Date.parse("2026-11-22T18:30:00Z");

export function getWeeklyPhotoIndex(date: Date): number {
  const elapsed = date.getTime() - ROTATION_START;
  if (!Number.isFinite(elapsed)) return 0;
  const week = Math.floor(elapsed / PHOTO_WEEK_MS);
  return ((week % HOME_PHOTOS.length) + HOME_PHOTOS.length) % HOME_PHOTOS.length;
}

export function getWeeklyPhoto(date: Date) {
  return HOME_PHOTOS[getWeeklyPhotoIndex(date)] ?? HOME_PHOTOS[0];
}