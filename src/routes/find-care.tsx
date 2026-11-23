import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AREAS, CITY_CENTRE, distanceKm, findArea, openSlots, type Area } from "@/lib/areas";
import { CADRE_TIERS, TIERS } from "@/lib/care-rules";
import { type Caregiver, uid, update, useStore } from "@/lib/store";

const CareMap = React.lazy(() => import("@/components/rc/CareMap"));

export const Route = createFileRoute("/find-care")({
  head: () => ({
    meta: [
      { title: "Find a caregiver near you — Rama Cares" },
      { name: "description", content: "Search trained caregivers and nurses by area or PIN code in Hyderabad, see them on a map and book a home assessment visit." },
      { property: "og:title", content: "Find a caregiver near you — Rama Cares" },
      { property: "og:description", content: "Search by area or PIN code, see caregivers on the map and book a nurse-led home assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FindCare,
});

type Located = Caregiver & { lat: number; lng: number; km: number | null };
const initials = (n: string) => n.replace(/^Sister /, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
const dayFmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const timeFmt = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

function FindCare() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [area, setArea] = useState<Area | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ cg: Located; slot: Date } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const list: Located[] = useMemo(() => {
    const withPos = s.caregivers.filter((c): c is Caregiver & { lat: number; lng: number } => c.lat != null && c.lng != null && c.status !== "Training");
    return withPos
      .map((c) => ({ ...c, km: area ? distanceKm(area, c) : null }))
      .filter((c) => c.km == null || c.km <= 12)
      .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [s.caregivers, area]);

  const booked = useMemo(() => s.patients.filter((p) => p.visitAt && p.preferredCaregiverId).map((p) => `${p.preferredCaregiverId}|${p.visitAt}`), [s.patients]);
  const onSelect = useCallback((id: string) => { setSelected(id); document.getElementById(`cg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, []);

  const search = (e: React.FormEvent) => { e.preventDefault(); const a = findArea(q); setArea(a); setNotFound(!a && q.trim() !== ""); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[1000] border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="font-display text-2xl text-primary">Rama Cares</Link>
          <form onSubmit={search} className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 shadow-xs md:max-w-xl">
            <input aria-label="Area or PIN code" list="areas" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Area or PIN code, e.g. Gachibowli or 500034" className="min-w-0 flex-1 bg-transparent py-1.5 outline-hidden placeholder:text-muted-foreground" />
            <datalist id="areas">{AREAS.map((a) => <option key={a.name} value={a.name}>{a.pin}</option>)}</datalist>
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Search</button>
          </form>
          <Link to="/" hash="enquire" className="hidden text-sm text-muted-foreground hover:text-primary md:block">Not sure? Talk to us</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <main className="px-6 py-8">
          <h1 className="font-display text-3xl md:text-4xl">{area ? `Care professionals near ${area.name}` : "Care professionals across Hyderabad"}</h1>
          <p className="mt-2 text-muted-foreground">
            {notFound ? "We couldn't find that area yet — showing everyone. Try a nearby area or PIN code." : `${list.length} available${area ? ` within 12 km of ${area.pin}` : ""}. Booking a slot schedules your free nurse assessment visit.`}
          </p>
          <div className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Every placement starts with a nurse assessment. The person you choose is your preference — your nurse confirms the match once your parent's care level is set.
          </div>

          <ul className="mt-6 space-y-4">
            {list.length === 0 && <li className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No one within 12 km yet. <Link to="/" hash="enquire" className="text-primary underline">Request a call back</Link> and we'll arrange care.</li>}
            {list.map((c, i) => {
              const slots = now ? openSlots(now, booked.filter((b) => b.startsWith(`${c.id}|`)).map((b) => b.split("|")[1] ?? "")).slice(0, 8) : [];
              return (
                <li key={c.id} id={`cg-${c.id}`} onMouseEnter={() => setSelected(c.id)}
                  className={`grid gap-5 rounded-2xl border bg-card p-5 transition-shadow sm:grid-cols-[auto_minmax(0,1fr)] ${selected === c.id ? "border-accent shadow-lg" : "border-border"}`}>
                  <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xl text-primary">
                    {initials(c.name)}
                    <span className="absolute -left-1 -top-1 grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-display text-xl">{c.name}</h2>
                      <span className="text-sm text-muted-foreground">{c.area} · {c.pin}{c.km != null && ` · ${c.km.toFixed(1)} km`}</span>
                    </div>
                    <p className="text-sm text-accent">{c.cadre} · cares for {CADRE_TIERS[c.cadre].map((t) => TIERS[t].name.toLowerCase()).join(", ")}</p>
                    {c.bio && <p className="mt-2 text-sm text-muted-foreground">{c.bio}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">Speaks {c.languages}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {slots.map((sl) => (
                        <button key={sl.toISOString()} onClick={() => setBooking({ cg: c, slot: sl })}
                          className="rounded-lg bg-primary/10 px-3 py-2 text-left text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                          <span className="block">{dayFmt(sl)}</span>{timeFmt(sl)}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>

        <aside className="order-first h-[45vh] border-b border-border lg:sticky lg:top-[73px] lg:order-none lg:h-[calc(100vh-73px)] lg:border-b-0 lg:border-l">
          <ClientOnly fallback={<div className="h-full w-full bg-muted" />}>
            <Suspense fallback={<div className="h-full w-full bg-muted" />}>
              <CareMap pins={list.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, label: c.name }))} centre={area ?? (notFound ? CITY_CENTRE : null)} selected={selected} onSelect={onSelect} />
            </Suspense>
          </ClientOnly>
        </aside>
      </div>

      {booking && <BookingDialog cg={booking.cg} slot={booking.slot} pin={area?.pin ?? booking.cg.pin ?? ""} onClose={() => setBooking(null)} />}
    </div>
  );
}

function BookingDialog({ cg, slot, pin, onClose }: { cg: Located; slot: Date; pin: string; onClose: () => void }) {
  const [f, setF] = useState({ name: "", age: "", condition: "", guardian: "", guardianPhone: "", pin });
  const [done, setDone] = useState(false);
  const field = "w-full border-b border-border bg-transparent py-2.5 outline-hidden placeholder:text-muted-foreground focus:border-primary";
  return (
    <div role="dialog" aria-modal="true" aria-label="Book assessment visit" className="fixed inset-0 z-[2000] grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h2 className="font-display text-3xl">You're booked.</h2>
            <p className="mt-3 text-muted-foreground">A nurse will visit on {dayFmt(slot)} at {timeFmt(slot)} to assess your parent. We've noted {cg.name} as your preferred caregiver. A care advisor will call you to confirm.</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Done</button>
          </>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            update((s) => ({ ...s, patients: [...s.patients, { id: uid(), name: f.name, age: Number(f.age) || 0, condition: f.condition, guardian: f.guardian, guardianPhone: f.guardianPhone, serviceLine: "Elderly care", journeyStep: 1, tier: null, caregiverId: null, backupId: null, careStart: null, lastNurseVisit: null, pin: f.pin, preferredCaregiverId: cg.id, visitAt: slot.toISOString() }] }));
            setDone(true);
          }}>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Assessment visit</p>
            <h2 className="mt-2 font-display text-2xl">{dayFmt(slot)} · {timeFmt(slot)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Preferred caregiver: {cg.name}, {cg.cadre}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input required className={field} placeholder="Patient's name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={field} placeholder="Age" inputMode="numeric" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
              <input className={`${field} sm:col-span-2`} placeholder="Condition or reason for care" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} />
              <input required className={field} placeholder="Your name" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} />
              <input required className={field} placeholder="Phone / WhatsApp" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} />
              <input required pattern="\d{6}" className={field} placeholder="Home PIN code" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value })} />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-sm hover:text-primary">Cancel</button>
              <button className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Confirm booking</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
