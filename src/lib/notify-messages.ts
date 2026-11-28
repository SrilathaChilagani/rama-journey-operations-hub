// Wording of every notification Rama Cares sends. Families never receive staff-only notes
// (incident descriptions); they get what happened and a link to the portal.
import type { Severity } from "./care-rules";

export type Message = { subject: string; body: string };

const dateIN = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function enquiryAlert(e: {
  name: string; age: string; serviceLine: string; condition: string; guardian: string; guardianPhone: string;
}, consoleUrl: string): Message {
  return {
    subject: `New assessment request: ${e.name} (${e.serviceLine})`,
    body: [
      "Rama Cares — new assessment request",
      `Patient: ${e.name}${e.age ? `, ${e.age}` : ""}`,
      `Service: ${e.serviceLine}`,
      e.condition ? `Care needs: ${e.condition}` : null,
      `Family: ${e.guardian}, ${e.guardianPhone}`,
      "",
      "Call back and book the nurse assessment (within 24 hours).",
      consoleUrl ? `Open: ${consoleUrl}/enquiries` : null,
    ].filter((l) => l !== null).join("\n"),
  };
}

export function concernAlert(c: { patientName: string; raisedBy: string; text: string }, consoleUrl: string): Message {
  return {
    subject: `Family concern: ${c.patientName}`,
    body: [
      "Rama Cares — a family has raised a concern",
      `Patient: ${c.patientName}`,
      `From: ${c.raisedBy}`,
      `"${c.text}"`,
      "",
      "SOP: acknowledge within 2 hours, resolve or share a plan within 48 hours.",
      consoleUrl && `Open: ${consoleUrl}/incidents`,
    ].filter(Boolean).join("\n"),
  };
}

export function incidentFamilyMessage(i: { patientName: string; severity: Severity; kind: string }, portalUrl: string): Message {
  const lead =
    i.severity === "Red"
      ? `We've logged an urgent incident for ${i.patientName}: ${i.kind}. Our Care Manager is handling it now and will call you.`
      : `We've logged an incident for ${i.patientName}: ${i.kind}. A nurse is advising and our Care Manager will keep you updated.`;
  return {
    subject: `Update about ${i.patientName}`,
    body: ["Rama Cares", lead, portalUrl && `Details and updates: ${portalUrl}/family`].filter(Boolean).join("\n\n"),
  };
}

export function dailyReportMessage(l: {
  patientName: string; date: string; bp: string; spo2: string; meals: string; meds: string; mood: string; notes: string;
}, portalUrl: string): Message {
  const vitals = [l.bp && `BP ${l.bp}`, l.spo2 && `Oxygen ${l.spo2}%`].filter(Boolean).join(", ");
  return {
    subject: `Daily report — ${l.patientName}, ${dateIN(l.date)}`,
    body: [
      `Rama Cares daily report — ${l.patientName}, ${dateIN(l.date)}`,
      vitals,
      l.meals && `Meals & fluids: ${l.meals}`,
      l.meds && `Medicines: ${l.meds}`,
      l.mood && `Mood: ${l.mood}`,
      l.notes,
      portalUrl && `\nAll reports: ${portalUrl}/family`,
    ].filter(Boolean).join("\n"),
  };
}
