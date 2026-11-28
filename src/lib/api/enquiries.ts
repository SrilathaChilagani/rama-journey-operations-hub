// Server functions for enquiries. Handlers run only on the server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requestIpHash } from "@/server/request";
import { enquiryDecision, enquirySchema, phoneKey } from "@/lib/enquiry";
import { requireStaff } from "@/server/auth";
import { query } from "@/server/db";
import { enquiryAlert } from "@/lib/notify-messages";
import { baseUrl, notifyStaff } from "@/server/notify";

export type SubmitResult = { ok: true; repeat?: boolean } | { ok: false; reason: "too-many" };

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(enquirySchema)
  .handler(async ({ data }): Promise<SubmitResult> => {
    if (data.website) return { ok: true }; // bot — pretend success, store nothing
    const ipHash = requestIpHash();
    const key = phoneKey(data.guardianPhone);
    const [counts] = await query<{ same_phone: number; same_ip: number; alerts: number }>(
      `select (select count(*) from enquiries where phone_key = $1 and created_at > now() - interval '24 hours')::int as same_phone,
              (select count(*) from enquiries where $2::text is not null and ip_hash = $2 and created_at > now() - interval '1 hour')::int as same_ip,
              (select count(*) from enquiries where alerted and created_at > now() - interval '1 hour')::int as alerts`,
      [key, ipHash],
    );
    const decision = enquiryDecision({
      samePhoneToday: counts!.same_phone, sameIpLastHour: counts!.same_ip, alertsLastHour: counts!.alerts,
    });
    if (decision.action === "too-many") return { ok: false, reason: "too-many" };
    if (decision.action === "duplicate") return { ok: true, repeat: true };
    await query(
      `insert into enquiries (patient_name, patient_age, condition, guardian_name, guardian_phone, service_line, ip_hash, phone_key, alerted)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [data.name, data.age, data.condition, data.guardian, data.guardianPhone, data.serviceLine, ipHash, key, decision.alert],
    );
    if (decision.alert) await notifyStaff("enquiry_new", enquiryAlert(data, baseUrl()));
    return { ok: true, repeat: counts!.same_phone > 0 };
  });

export type EnquiryRow = {
  id: string;
  patient_name: string;
  patient_age: string;
  condition: string;
  guardian_name: string;
  guardian_phone: string;
  service_line: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export const listEnquiries = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const rows = await query<EnquiryRow>(
    `select id, patient_name, patient_age, condition, guardian_name, guardian_phone,
            service_line, status, created_at::text as created_at
       from enquiries order by created_at desc limit 500`,
  );
  return rows;
});

export const setEnquiryStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "closed"]) }))
  .handler(async ({ data }) => {
    await requireStaff();
    await query(`update enquiries set status = $2, updated_at = now() where id = $1`, [data.id, data.status]);
    return { ok: true as const };
  });
