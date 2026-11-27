// Server functions for staff sign-in. Handlers run only on the server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { currentStaff, login, logout } from "@/server/auth";

export const getStaff = createServerFn({ method: "GET" }).handler(async () => currentStaff());

export const staffLogin = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }))
  .handler(async ({ data }) => login(data.email, data.password));

export const staffLogout = createServerFn({ method: "POST" }).handler(async () => {
  await logout();
  return { ok: true as const };
});
