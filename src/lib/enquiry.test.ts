import { describe, expect, it } from "vitest";
import { enquiryDecision, enquirySchema, formatEnquiry, phoneKey, whatsappLink, type Enquiry } from "./enquiry";

const e: Enquiry = {
  name: "Test Patient",
  age: "78",
  condition: "Hip surgery",
  guardian: "Test Family",
  guardianPhone: "+91 90000 00000",
  serviceLine: "Rehabilitation",
};

describe("enquiry", () => {
  it("formats every field into the WhatsApp message", () => {
    const text = formatEnquiry(e);
    for (const v of [e.name, e.age, e.condition, e.guardian, e.guardianPhone, e.serviceLine])
      expect(text).toContain(v);
  });

  it("builds a wa.me link from a formatted number, or none when unset", () => {
    expect(whatsappLink("+91 98765-43210", "hi there")).toBe(
      "https://wa.me/919876543210?text=hi%20there",
    );
    expect(whatsappLink("", "hi")).toBeNull();
  });

  it("accepts a normal enquiry and trims it", () => {
    const r = enquirySchema.safeParse({ ...e, name: "  Test Patient  " });
    expect(r.success && r.data.name).toBe("Test Patient");
  });

  it("rejects missing names, bad phones, bad ages and unknown services", () => {
    expect(enquirySchema.safeParse({ ...e, name: " " }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...e, guardianPhone: "call me" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...e, age: "seventy" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...e, serviceLine: "Massage" }).success).toBe(false);
  });
});

describe("enquiry spam limits", () => {
  const base = { samePhoneToday: 0, sameIpLastHour: 0, alertsLastHour: 0 };
  it("saves and alerts staff for a family's first request of the day", () => {
    expect(enquiryDecision(base)).toEqual({ action: "save", alert: true });
  });
  it("saves a repeat request from the same family without alerting again", () => {
    expect(enquiryDecision({ ...base, samePhoneToday: 1 })).toEqual({ action: "save", alert: false });
  });
  it("stops saving after 3 requests from one number in a day", () => {
    expect(enquiryDecision({ ...base, samePhoneToday: 3 })).toEqual({ action: "duplicate" });
  });
  it("refuses a flood from one connection", () => {
    expect(enquiryDecision({ ...base, sameIpLastHour: 5 })).toEqual({ action: "too-many" });
  });
  it("still saves during a spam wave but stops alerting staff", () => {
    expect(enquiryDecision({ ...base, alertsLastHour: 20 })).toEqual({ action: "save", alert: false });
  });
  it("matches phone numbers however they were typed", () => {
    expect(phoneKey("+91 98765-43210")).toBe(phoneKey("9876543210"));
  });
});
