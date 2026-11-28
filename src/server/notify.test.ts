import { describe, expect, it, vi } from "vitest";
import { baseUrl, sendEmail, sendWhatsApp, staffTargets } from "./notify";

const msg = { subject: "S", body: "Hello" };
const ok = (body: object, status = 201) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
const tw = { TWILIO_ACCOUNT_SID: "ACx", TWILIO_AUTH_TOKEN: "t", TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886" };

describe("notification channels", () => {
  it("skips (doesn't fail) when a channel isn't configured", async () => {
    expect(await sendWhatsApp("+919000000000", msg, "daily_report", {}, vi.fn())).toMatchObject({ ok: false, skipped: true });
    expect(await sendEmail("a@b.c", msg, {}, vi.fn())).toMatchObject({ ok: false, skipped: true });
  });
  it("sends WhatsApp as free text, or as an approved template when one is configured", async () => {
    const f = ok({ sid: "SM1" });
    expect(await sendWhatsApp("+919000000000", msg, "daily_report", tw, f)).toEqual({ ok: true, id: "SM1" });
    const body = new URLSearchParams(f.mock.calls[0]![1].body);
    expect(body.get("To")).toBe("whatsapp:+919000000000");
    expect(body.get("Body")).toBe("Hello");
    const g = ok({ sid: "SM2" });
    await sendWhatsApp("+919000000000", msg, "daily_report", { ...tw, TWILIO_WA_TEMPLATE_DAILY_REPORT: "HX1" }, g);
    const tb = new URLSearchParams(g.mock.calls[0]![1].body);
    expect(tb.get("ContentSid")).toBe("HX1");
    expect(JSON.parse(tb.get("ContentVariables")!)).toEqual({ 1: "Hello" });
    expect(tb.get("Body")).toBeNull();
  });
  it("reports Twilio and Resend errors with the provider's reason", async () => {
    expect(await sendWhatsApp("+91900", msg, "daily_report", tw, ok({ code: 63016, message: "outside window" }, 400)))
      .toEqual({ ok: false, error: "Twilio 63016: outside window" });
    expect(await sendEmail("a@b.c", msg, { RESEND_API_KEY: "k" }, ok({ message: "bad from" }, 422)))
      .toEqual({ ok: false, error: "Resend 422: bad from" });
    expect(await sendEmail("a@b.c", msg, { RESEND_API_KEY: "k" }, ok({ id: "e1" }, 200))).toEqual({ ok: true, id: "e1" });
  });
  it("builds staff targets and the public base URL", () => {
    expect(staffTargets({ STAFF_ALERT_WHATSAPP: "+911, +912", STAFF_ALERT_EMAILS: "a@b.c" })).toEqual([
      { channel: "whatsapp", to: "+911" }, { channel: "whatsapp", to: "+912" }, { channel: "email", to: "a@b.c" },
    ]);
    expect(baseUrl({ APP_BASE_URL: "https://ramacares.in/" })).toBe("https://ramacares.in");
    expect(baseUrl({ VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://x.vercel.app");
    expect(baseUrl({})).toBe("");
  });
});
