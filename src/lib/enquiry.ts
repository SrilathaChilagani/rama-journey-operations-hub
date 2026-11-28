import { z } from "zod";

export const SERVICE_LINES = ["Post-hospitalisation", "Elderly care", "Rehabilitation"] as const;

// One set of rules for the public form, checked again on the server before saving.
export const enquirySchema = z.object({
  name: z.string().trim().min(1, "Patient's name is required").max(100),
  age: z.string().trim().regex(/^\d{0,3}$/, "Age should be a number").default(""),
  condition: z.string().trim().max(500).default(""),
  guardian: z.string().trim().min(1, "Your name is required").max(100),
  guardianPhone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{6,20}$/, "Please enter a valid phone number"),
  serviceLine: z.enum(SERVICE_LINES),
  // Honeypot: hidden from people, filled in by spam bots.
  website: z.string().max(200).optional(),
});

export type Enquiry = z.input<typeof enquirySchema>;

export function formatEnquiry(e: Enquiry): string {
  return [
    "New assessment request — Rama Cares",
    `Patient: ${e.name}${e.age ? `, age ${e.age}` : ""}`,
    `Service: ${e.serviceLine}`,
    `Care needs: ${e.condition || "—"}`,
    `Contact: ${e.guardian}, ${e.guardianPhone}`,
  ].join("\n");
}

// Spam limits for the public form. Repeat requests from one family are saved (they may be adding
// details) but only the first in a day alerts staff; floods from one connection are refused; and a
// global hourly cap stops a spam wave from flooding staff phones with WhatsApp alerts.
export const ENQUIRY_LIMITS = { perPhonePerDay: 3, perIpPerHour: 5, alertsPerHour: 20 } as const;

/** Compares numbers however they were typed: last 10 digits ("+91 98765-43210" = "9876543210"). */
export const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-10);

export type EnquiryDecision =
  | { action: "save"; alert: boolean }
  | { action: "duplicate" } // same family already sent several today — not saved again
  | { action: "too-many" }; // too many from this connection in the last hour

export function enquiryDecision(c: { samePhoneToday: number; sameIpLastHour: number; alertsLastHour: number }): EnquiryDecision {
  if (c.sameIpLastHour >= ENQUIRY_LIMITS.perIpPerHour) return { action: "too-many" };
  if (c.samePhoneToday >= ENQUIRY_LIMITS.perPhonePerDay) return { action: "duplicate" };
  return { action: "save", alert: c.samePhoneToday === 0 && c.alertsLastHour < ENQUIRY_LIMITS.alertsPerHour };
}

export function whatsappLink(number: string, text: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
