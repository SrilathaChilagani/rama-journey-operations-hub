// Hyderabad service areas with PIN codes and map positions (approximate centres).
export type Area = { name: string; pin: string; lat: number; lng: number };
export const AREAS: Area[] = [
  { name: "Banjara Hills", pin: "500034", lat: 17.4156, lng: 78.4347 },
  { name: "Jubilee Hills", pin: "500033", lat: 17.4326, lng: 78.4071 },
  { name: "Kukatpally", pin: "500072", lat: 17.4849, lng: 78.4138 },
  { name: "Gachibowli", pin: "500032", lat: 17.4401, lng: 78.3489 },
  { name: "Madhapur", pin: "500081", lat: 17.4483, lng: 78.3915 },
  { name: "Secunderabad", pin: "500003", lat: 17.4399, lng: 78.4983 },
  { name: "Begumpet", pin: "500016", lat: 17.4447, lng: 78.4664 },
  { name: "Dilsukhnagar", pin: "500060", lat: 17.3687, lng: 78.5247 },
  { name: "Ameerpet", pin: "500016", lat: 17.4375, lng: 78.4482 },
  { name: "Kondapur", pin: "500084", lat: 17.4698, lng: 78.3578 },
  { name: "LB Nagar", pin: "500074", lat: 17.3457, lng: 78.5522 },
  { name: "Mehdipatnam", pin: "500028", lat: 17.3959, lng: 78.4331 },
];
export const CITY_CENTRE = { lat: 17.425, lng: 78.45 };

/** Find an area by PIN code or name (case-insensitive, partial name allowed). */
export function findArea(q: string): Area | null {
  const t = q.trim().toLowerCase();
  if (!t) return null;
  return AREAS.find((a) => a.pin === t) ?? AREAS.find((a) => a.name.toLowerCase().startsWith(t)) ?? AREAS.find((a) => a.name.toLowerCase().includes(t)) ?? null;
}

/** Straight-line distance in km between two points. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Visit slots for the next `days` days starting tomorrow, minus already-booked ones. */
export function openSlots(from: Date, booked: string[], days = 5): Date[] {
  const out: Date[] = [];
  for (let d = 1; d <= days; d++) for (const h of [9, 11, 14, 16]) {
    const s = new Date(from.getFullYear(), from.getMonth(), from.getDate() + d, h);
    if (!booked.includes(s.toISOString())) out.push(s);
  }
  return out;
}
