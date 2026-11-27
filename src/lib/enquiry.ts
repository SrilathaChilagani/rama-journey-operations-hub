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

export function whatsappLink(number: string, text: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
