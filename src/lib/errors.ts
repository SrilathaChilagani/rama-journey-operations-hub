/**
 * An expected "no" — not signed in, an SOP rule, a missing record. Shown to the user as-is and
 * NOT reported to Sentry. Anything else thrown on the server is a real fault and is reported.
 */
export class Refusal extends Error {
  override name = "Refusal";
}

const REFUSAL_MESSAGES = /^(Not signed in|Consent required|Only admins)/;

/** Server functions lose the class when an error crosses to the browser, so check the message too. */
export function isRefusal(e: unknown): boolean {
  if (e instanceof Refusal) return true;
  return e instanceof Error && (e.name === "Refusal" || REFUSAL_MESSAGES.test(e.message));
}
