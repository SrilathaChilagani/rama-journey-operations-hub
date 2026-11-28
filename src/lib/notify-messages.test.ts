import { describe, expect, it } from "vitest";
import { concernAlert, dailyReportMessage, enquiryAlert, incidentFamilyMessage } from "./notify-messages";

describe("notification wording", () => {
  it("enquiry alert carries contact details and a console link", () => {
    const m = enquiryAlert({ name: "Gopal", age: "79", serviceLine: "Rehabilitation", condition: "", guardian: "Kiran", guardianPhone: "+1 408 555 0100" }, "https://x.test");
    expect(m.subject).toBe("New assessment request: Gopal (Rehabilitation)");
    expect(m.body).toContain("Family: Kiran, +1 408 555 0100");
    expect(m.body).toContain("https://x.test/enquiries");
    expect(m.body).not.toContain("Care needs");
  });
  it("concern alert quotes the family and states the SOP deadline", () => {
    const m = concernAlert({ patientName: "Gopal", raisedBy: "Kiran", text: "Late again" }, "");
    expect(m.body).toContain('"Late again"');
    expect(m.body).toContain("within 2 hours");
    expect(m.body).not.toContain("Open:");
  });
  it("family incident message never includes staff notes, and Red promises a call", () => {
    const red = incidentFamilyMessage({ patientName: "Gopal", severity: "Red", kind: "Fall" }, "https://x.test");
    expect(red.body).toContain("urgent incident for Gopal: Fall");
    expect(red.body).toContain("will call you");
    expect(red.body).toContain("https://x.test/family");
    const amber = incidentFamilyMessage({ patientName: "Gopal", severity: "Amber", kind: "Wound" }, "");
    expect(amber.body).not.toContain("urgent");
  });
  it("daily report lists only what was recorded", () => {
    const m = dailyReportMessage({ patientName: "Gopal", date: "2026-11-27T06:00:00Z", bp: "128/82", spo2: "", meals: "3 meals", meds: "", mood: "Cheerful", notes: "" }, "");
    expect(m.body).toContain("BP 128/82");
    expect(m.body).not.toContain("Oxygen");
    expect(m.body).not.toContain("Medicines");
    expect(m.body).toContain("27 Nov");
  });
});
