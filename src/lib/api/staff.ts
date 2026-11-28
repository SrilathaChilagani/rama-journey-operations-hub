// Server functions for staff sign-in. Handlers run only on the server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { currentStaff, login, logout, resendCode, verifyCode } from "@/server/auth";
import { createStaffUser, listStaffUsers, resetStaffPassword, updateStaffUser } from "@/server/staff-admin";
export type { StaffRow } from "@/server/staff-admin";

export const getStaff = createServerFn({ method: "GET" }).handler(async () => currentStaff());

export const staffLogin = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }))
  .handler(async ({ data }) => login(data.email, data.password));

export const staffVerifyCode = createServerFn({ method: "POST" })
  .validator(z.object({ code: z.string().regex(/^\d{4,10}$/), remember: z.boolean() }))
  .handler(async ({ data }) => verifyCode(data.code, data.remember));

export const staffResendCode = createServerFn({ method: "POST" }).handler(async () => resendCode());

// ---- Staff page (admins only; every handler re-checks the admin role) ----
const role = z.enum(["admin", "staff"]);
const phone = z.string().trim().max(30);

export const listStaff = createServerFn({ method: "GET" }).handler(async () => listStaffUsers());

export const addStaff = createServerFn({ method: "POST" })
  .validator(z.object({
    email: z.string().trim().email().max(200), name: z.string().trim().min(1).max(100),
    role, phone, password: z.string().max(200),
  }))
  .handler(async ({ data }) => createStaffUser(data));

export const editStaff = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(100), role, phone, active: z.boolean() }))
  .handler(async ({ data }) => updateStaffUser(data));

export const resetPassword = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), password: z.string().max(200) }))
  .handler(async ({ data }) => resetStaffPassword(data));

export const staffLogout =createServerFn({ method: "POST" }).handler(async () => {
  await logout();
  return { ok: true as const };
});
