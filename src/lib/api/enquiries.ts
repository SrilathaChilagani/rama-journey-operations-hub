// Server functions for enquiries. Handlers run only on the server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enquirySchema } from "@/lib/enquiry";
import { requireStaff } from "@/server/auth";
import { query } from "@/server/db";

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator(enquirySchema)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const }; // bot — pretend success, store nothing
    await query(
      `insert into enquiries (patient_name, patient_age, condition, guardian_name, guardian_phone, service_line)
       values ($1, $2, $3, $4, $5, $6)`,
      [data.name, data.age, data.condition, data.guardian, data.guardianPhone, data.serviceLine],
    );
    return { ok: true as const };
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
