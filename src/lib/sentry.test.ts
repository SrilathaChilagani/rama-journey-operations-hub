import { afterEach, describe, expect, it, vi } from "vitest";
import { Refusal } from "./errors";
import { buildEnvelope, parseDsn, parseStack, reportError, scrub } from "./sentry";

const DSN = "https://abc123@o42.ingest.sentry.io/777";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sentry reporter", () => {
  it("parses a DSN into the envelope endpoint, or nothing when unset/invalid", () => {
    expect(parseDsn(DSN)).toEqual({ endpoint: "https://o42.ingest.sentry.io/api/777/envelope/", key: "abc123", dsn: DSN });
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("not a url")).toBeNull();
  });

  it("turns a stack trace into frames, oldest call first", () => {
    const frames = parseStack("Error: boom\n    at inner (/app/src/a.ts:10:5)\n    at outer (/app/node_modules/x/b.js:2:1)");
    expect(frames.map((f) => f.function)).toEqual(["outer", "inner"]);
    expect(frames[1]).toMatchObject({ filename: "/app/src/a.ts", lineno: 10, colno: 5, in_app: true });
    expect(frames[0]!.in_app).toBe(false);
  });

  it("masks phone numbers and emails echoed in error messages", () => {
    expect(scrub('duplicate key (phone)=(+91 98765 43210) for a@b.com')).toBe("duplicate key (phone)=([number]) for [email]");
  });

  it("builds a 3-line envelope with the error and tags, without request data", () => {
    const env = buildEnvelope(new TypeError("db down"), { side: "server", path: "/enquiries" }, parseDsn(DSN)!);
    const [header, item, event] = env.split("\n").map((l) => JSON.parse(l));
    expect(header.dsn).toBe(DSN);
    expect(item.type).toBe("event");
    expect(event.exception.values[0]).toMatchObject({ type: "TypeError", value: "db down" });
    expect(event.tags.side).toBe("server");
    expect(event.request).toBeUndefined();
  });

  it("sends real faults but never expected refusals, and nothing without a DSN", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    await reportError(new Error("no DSN yet"), { side: "server" });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("VITE_SENTRY_DSN", DSN);
    await reportError(new Refusal("Not signed in"), { side: "server" });
    await reportError(new Error("Not signed in"), { side: "server" }); // refusal after crossing to the browser
    expect(fetchMock).not.toHaveBeenCalled();

    await reportError(new Error("database unreachable"), { side: "server", path: "/x" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toContain("https://o42.ingest.sentry.io/api/777/envelope/?sentry_key=abc123");

    await reportError(new Error("database unreachable"), { side: "server", path: "/x" }); // same fault again this minute
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
