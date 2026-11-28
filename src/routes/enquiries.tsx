import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Badge, Card, head } from "@/components/rc/AppShell";
import { listEnquiries, setEnquiryStatus, type EnquiryRow } from "@/lib/api/enquiries";
import { addPatient } from "@/lib/api/console";
import { SERVICE_LINES } from "@/lib/enquiry";
import { fmt, run } from "@/lib/store";

export const Route = createFileRoute("/enquiries")({
  head: head("Enquiries", "Assessment requests sent from the Rama Cares website."),
  component: Enquiries,
});

const TONE = { new: "red", contacted: "amber", closed: "green" } as const;

function Enquiries() {
  return (
    <AppShell title="Enquiries" subtitle="Assessment requests from the website. Call the family back, then create the patient record — it starts at step 1 of the journey.">
      <EnquiryList />
    </AppShell>
  );
}

// Mounted only after sign-in (AppShell renders children once a staff session exists).
function EnquiryList() {
  const [rows, setRows] = useState<EnquiryRow[] | null>(null);
  const [error, setError] = useState(false);
  const load = () => listEnquiries().then(setRows, () => setError(true));
  useEffect(() => {
    load();
  }, []);

  const toPatient = async (e: EnquiryRow) => {
    const serviceLine = (SERVICE_LINES as readonly string[]).includes(e.service_line)
      ? (e.service_line as (typeof SERVICE_LINES)[number])
      : "Elderly care";
    const ok = await run(() => addPatient({ data: {
      name: e.patient_name, age: e.patient_age, condition: e.condition, guardian: e.guardian_name,
      guardianPhone: e.guardian_phone, serviceLine, enquiryId: e.id,
    } }));
    if (ok) await load();
  };

  const changeStatus = async (id: string, status: EnquiryRow["status"]) => {
    setRows((r) => r?.map((x) => (x.id === id ? { ...x, status } : x)) ?? r);
    await setEnquiryStatus({ data: { id, status } }).catch(load);
  };

  return (
    <>
      {error && <Card><p className="text-sm text-destructive">Couldn't load enquiries. Refresh the page or sign in again.</p></Card>}
      {rows === null && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
      {rows?.length === 0 && <Card><p className="text-sm text-muted-foreground">No enquiries yet.</p></Card>}
      <div className="space-y-4">
        {rows?.map((e) => (
          <Card key={e.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-xl">{e.patient_name}{e.patient_age ? `, ${e.patient_age}` : ""}</h3>
                <p className="text-sm text-muted-foreground">{e.service_line} · received {fmt(e.created_at)}</p>
              </div>
              <Badge tone={TONE[e.status]}>{e.status}</Badge>
            </div>
            {e.condition && <p className="mt-3 text-sm">{e.condition}</p>}
            <p className="mt-3 text-sm">
              Family contact: {e.guardian_name} · <a className="text-primary underline" href={`tel:${e.guardian_phone.replace(/[^\d+]/g, "")}`}>{e.guardian_phone}</a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {e.status !== "closed" && (
                <button onClick={() => toPatient(e)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                  Create patient record
                </button>
              )}
              {(["new", "contacted", "closed"] as const).filter((s) => s !== e.status).map((s) => (
                <button key={s} onClick={() => changeStatus(e.id, s)} className="rounded-md border border-input px-3 py-1.5 text-xs">
                  Mark {s}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
