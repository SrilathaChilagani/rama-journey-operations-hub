// Rules for managing staff logins (Staff page). Checked on the server before any change.
export type Role = "admin" | "staff";
export const MIN_PASSWORD = 10;

export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 200) return "Password is too long.";
  return null;
}

/**
 * Why a change to a staff login isn't allowed, or null if it is. Keeps the business from locking
 * itself out: admins can't remove their own admin rights or access, and there must always be at
 * least one active admin.
 */
export function staffChangeBlockReason(c: {
  isSelf: boolean;
  targetIsActiveAdmin: boolean;
  activeAdmins: number;
  newRole: Role;
  newActive: boolean;
}): string | null {
  const losesAdmin = c.targetIsActiveAdmin && (c.newRole !== "admin" || !c.newActive);
  if (c.isSelf && !c.newActive) return "You can't turn off your own login.";
  if (c.isSelf && losesAdmin) return "You can't remove your own admin rights. Ask another admin.";
  if (losesAdmin && c.activeAdmins <= 1) return "There must always be at least one active admin.";
  return null;
}
