// Managing staff logins (server only, admins only). Turning a login off or resetting its password
// signs that person out everywhere and forgets their trusted devices.
import { Refusal } from "@/lib/errors";
import { normalizePhone } from "@/lib/phone";
import { passwordProblem, staffChangeBlockReason, type Role } from "@/lib/staff-rules";
import { requireStaff, type Staff } from "./auth";
import { query } from "./db";
import { hashPassword } from "./password";

export type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  active: boolean;
  locked: boolean;
  created_at: string;
};
export type AdminResult = { ok: true } | { ok: false; error: string };

export async function requireAdmin(): Promise<Staff> {
  const me = await requireStaff();
  if (me.role !== "admin") throw new Refusal("Only admins can manage staff logins");
  return me;
}

async function signOutEverywhere(userId: string) {
  await query(`delete from staff_sessions where user_id = $1`, [userId]);
  await query(`delete from staff_trusted_devices where user_id = $1`, [userId]);
  await query(`delete from staff_login_challenges where user_id = $1`, [userId]);
}

function phoneOrError(raw: string): { phone: string | null } | { error: string } {
  if (!raw.trim()) return { phone: null };
  const phone = normalizePhone(raw);
  return phone ? { phone } : { error: "Enter a valid mobile number, e.g. 98765 43210 or +91 98765 43210." };
}

export async function listStaffUsers(): Promise<StaffRow[]> {
  await requireAdmin();
  return query<StaffRow>(
    `select id, email, name, role, phone, active, coalesce(locked_until > now(), false) as locked,
            created_at::text as created_at
       from staff_users order by active desc, name`,
  );
}

export async function createStaffUser(d: { email: string; name: string; role: Role; phone: string; password: string }): Promise<AdminResult> {
  await requireAdmin();
  const pw = passwordProblem(d.password);
  if (pw) return { ok: false, error: pw };
  const p = phoneOrError(d.phone);
  if ("error" in p) return { ok: false, error: p.error };
  const email = d.email.trim().toLowerCase();
  const exists = await query(`select 1 from staff_users where email = $1`, [email]);
  if (exists.length) return { ok: false, error: "A login with this email already exists. Turn it back on or reset its password instead." };
  await query(
    `insert into staff_users (email, name, role, phone, password_hash) values ($1, $2, $3, $4, $5)`,
    [email, d.name.trim(), d.role, p.phone, await hashPassword(d.password)],
  );
  return { ok: true };
}

export async function updateStaffUser(d: { id: string; name: string; role: Role; phone: string; active: boolean }): Promise<AdminResult> {
  const me = await requireAdmin();
  const [target] = await query<{ role: Role; active: boolean; phone: string | null }>(
    `select role, active, phone from staff_users where id = $1`, [d.id],
  );
  if (!target) return { ok: false, error: "That login no longer exists." };
  const [{ n }] = (await query<{ n: number }>(`select count(*)::int as n from staff_users where role = 'admin' and active`)) as [{ n: number }];
  const blocked = staffChangeBlockReason({
    isSelf: me.id === d.id,
    targetIsActiveAdmin: target.role === "admin" && target.active,
    activeAdmins: n,
    newRole: d.role,
    newActive: d.active,
  });
  if (blocked) return { ok: false, error: blocked };
  const p = phoneOrError(d.phone);
  if ("error" in p) return { ok: false, error: p.error };
  await query(
    `update staff_users set name = $2, role = $3, phone = $4, active = $5 where id = $1`,
    [d.id, d.name.trim(), d.role, p.phone, d.active],
  );
  if (!d.active) await signOutEverywhere(d.id);
  // A new phone must prove itself with a fresh SMS code on every device.
  else if (p.phone !== target.phone) await query(`delete from staff_trusted_devices where user_id = $1`, [d.id]);
  return { ok: true };
}

export async function resetStaffPassword(d: { id: string; password: string }): Promise<AdminResult> {
  await requireAdmin();
  const pw = passwordProblem(d.password);
  if (pw) return { ok: false, error: pw };
  const rows = await query(
    `update staff_users set password_hash = $2, failed_attempts = 0, locked_until = null where id = $1 returning id`,
    [d.id, await hashPassword(d.password)],
  );
  if (!rows.length) return { ok: false, error: "That login no longer exists." };
  await signOutEverywhere(d.id);
  return { ok: true };
}
