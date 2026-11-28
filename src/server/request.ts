// Request helpers (server only).
import { createHash } from "node:crypto";
import { getRequestIP } from "@tanstack/react-start/server";

/** SHA-256 of the caller's IP (behind Vercel's proxy), so we can rate-limit without storing it. */
export function requestIpHash(): string | null {
  const ip = getRequestIP({ xForwardedFor: true });
  return ip ? createHash("sha256").update(`rama-cares:${ip}`).digest("hex") : null;
}
