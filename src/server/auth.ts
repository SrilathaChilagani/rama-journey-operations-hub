// Staff sessions (server only): random token in an httpOnly cookie, SHA-256 of it in the DB.
import { createHash, randomBytes } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { query } from "./db";
import { DUMMY_HASH, verifyPassword } from "./password";

export const SESSION_COOKIE = "rc_staff";
const SESSION_DAYS = 30;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type Staff = { id: string; email: string; name: string; role: "admin" | "staff" };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function currentStaff(): Promise<Staff | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const rows = await query<Staff>(
    `select u.id, u.email, u.name, u.role
       from staff_sessions s join staff_users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now() and u.active`,
    [sha256(token)],
  );
  return rows[0] ?? null;
}

export async function requireStaff(): Promise<Staff> {
  const staff = await currentStaff();
  if (!staff) throw new Error("Not signed in");
  return staff;
}

export type LoginResult = { ok: true; staff: Staff } | { ok: false; reason: "invalid" | "locked" };

export async function login(email: string, password: string): Promise<LoginResult> {
  const rows = await query<Staff & { password_hash: string; locked: boolean }>(
    `select id, email, name, role, password_hash,
            coalesce(locked_until > now(), false) as locked
       from staff_users where email = $1 and active`,
    [email.trim().toLowerCase()],
  );
  const user = rows[0];
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user) return { ok: false, reason: "invalid" };
  if (user.locked) return { ok: false, reason: "locked" };
  if (!valid) {
    await query(
      `update staff_users
          set failed_attempts = failed_attempts + 1,
              locked_until = case when failed_attempts + 1 >= $2
                                  then now() + make_interval(mins => $3) end
        where id = $1`,
      [user.id, MAX_FAILED, LOCK_MINUTES],
    );
    return { ok: false, reason: "invalid" };
  }
  await query(`update staff_users set failed_attempts = 0, locked_until = null where id = $1`, [user.id]);
  const token = randomBytes(32).toString("base64url");
  await query(
    `insert into staff_sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [sha256(token), user.id, SESSION_DAYS],
  );
  await query(`delete from staff_sessions where expires_at < now()`);
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return { ok: true, staff: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export async function logout(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) await query(`delete from staff_sessions where token_hash = $1`, [sha256(token)]);
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
