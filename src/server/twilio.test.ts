import { describe, expect, it, vi } from "vitest";
import { E164, checkSmsCode, maskPhone, sendSmsCode, verifyConfig } from "./twilio";

const env = { TWILIO_ACCOUNT_SID: "ACtest", TWILIO_AUTH_TOKEN: "tok", TWILIO_VERIFY_SERVICE_SID: "VAtest" };
const reply = (status: number, body: object) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("Twilio Verify", () => {
  it("is unconfigured unless all three settings exist", () => {
    expect(verifyConfig({})).toBeNull();
    expect(verifyConfig({ ...env, TWILIO_AUTH_TOKEN: "" })).toBeNull();
    expect(verifyConfig(env)).not.toBeNull();
  });

  it("sends an SMS verification to the right service with basic auth", async () => {
    const f = reply(201, { status: "pending" });
    expect(await sendSmsCode("+919876543210", env, f)).toBe(true);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("https://verify.twilio.com/v2/Services/VAtest/Verifications");
    expect(init.headers.Authorization).toBe("Basic " + btoa("ACtest:tok"));
    expect(init.body).toBe("To=%2B919876543210&Channel=sms");
  });

  it("approves only when Twilio says approved", async () => {
    expect(await checkSmsCode("+919876543210", "123456", env, reply(200, { status: "approved" }))).toBe(true);
    expect(await checkSmsCode("+919876543210", "000000", env, reply(200, { status: "pending" }))).toBe(false);
    expect(await checkSmsCode("+919876543210", "123456", env, reply(404, { code: 20404 }))).toBe(false);
  });

  it("refuses to send when not configured", async () => {
    await expect(sendSmsCode("+919876543210", {}, vi.fn())).rejects.toThrow(/not configured/);
  });

  it("masks phone numbers and validates E.164", () => {
    expect(maskPhone("+919876543210")).toBe("+91 ••••• 43210");
    expect(maskPhone("+14085550142")).toBe("+1 ••••• 50142");
    expect(E164.test("+919876543210")).toBe(true);
    expect(E164.test("9876543210")).toBe(false);
  });
});
