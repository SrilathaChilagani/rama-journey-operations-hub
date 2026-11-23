import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import hero from "@/assets/home-care-nurse.jpg";
import { TIERS, type Tier } from "@/lib/care-rules";
import { SERVICES } from "@/lib/services";
import { type Patient, uid, update } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rama Cares — Nurse-led home care in Hyderabad" },
      { name: "description", content: "Trained caregivers and nurses at home after hospital and for elderly parents in Hyderabad. Nurse-assessed, supervised, with a daily report to family anywhere in the world." },
      { property: "og:title", content: "Rama Cares — Nurse-led home care in Hyderabad" },
      { property: "og:description", content: "Care with the attention your own children would give — supervised by nurses, reported to you daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PROMISES = [
  ["Assessment within 24 hours", "A registered nurse visits before anyone is sent."],
  ["A written care plan", "Goals, routine, red flags — signed by you."],
  ["Nurse visit within 48 hours", "Then on a fixed supervision cycle."],
  ["A daily report to you", "On WhatsApp, wherever in the world you are."],
  ["A named backup caregiver", "Introduced in week one, so care never stops."],
  ["Escalation by rule", "Written red-flag thresholds — no guesswork."],
];
const STEPS = ["Tell us about your parent", "A nurse assesses at home or hospital", "We agree a care plan together", "Meet your caregiver and backup", "Care begins — with daily updates"];

function Home() {
  return (
    <div className="bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <span className="font-display text-2xl text-primary">Rama Cares</span>
          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#services" className="hover:text-primary">Services</a>
            <a href="#promise" className="hover:text-primary">Our promise</a>
            <a href="#how" className="hover:text-primary">How it works</a>
          </nav>
          <a href="#enquire" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Book an assessment</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[1.1fr_1fr] lg:pt-40">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Home care · Hyderabad</p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl">Care with the attention your own children would give.</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">For families who can't always be there. Trained caregivers and nurses at home — assessed, supervised and reported to you every day.</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#enquire" className="rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground hover:bg-primary/90">Request a nurse assessment</a>
            <a href="#how" className="rounded-full border border-foreground/20 px-7 py-3.5 font-medium hover:border-primary hover:text-primary">How it works</a>
          </div>
        </div>
        <div className="relative">
          <img src={hero} alt="A Rama Cares nurse holding hands with an elderly woman at home" width={1280} height={1536} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl" />
          <div className="absolute -bottom-6 -left-6 max-w-[16rem] rounded-2xl bg-card p-5 shadow-xl">
            <p className="font-display text-lg">"Daily report received"</p>
            <p className="mt-1 text-sm text-muted-foreground">BP 128/82 · walked 20 m · lunch finished · in good spirits</p>
          </div>
        </div>
      </section>

      <section id="services" className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="max-w-2xl font-display text-4xl md:text-5xl">Four ways we care.</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="group bg-card p-10 transition-colors hover:bg-secondary"
              >
                <span className="font-display text-accent">{s.n}</span>
                <h3 className="mt-4 font-display text-2xl">{s.name}</h3>
                <p className="mt-3 text-muted-foreground">{s.short}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Read the full detail
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="promise" className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Not a placement agency</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">Every placement is led and supervised by a nurse.</h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map(([t, d]) => (
              <div key={t} className="border-t border-primary-foreground/20 pt-6">
                <h3 className="font-display text-xl">{t}</h3>
                <p className="mt-2 opacity-75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="font-display text-4xl md:text-5xl">The right level of care, set by a nurse.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">Never by a sales call. So your parent always gets someone trained for what they need.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {(Object.keys(TIERS) as Tier[]).map((t) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <span className="text-xs tracking-widest text-accent">{t}</span>
              <h3 className="mt-2 font-display text-xl">{TIERS[t].name}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{TIERS[t].staff}</p>
              <p className="mt-1 text-sm text-muted-foreground">{TIERS[t].supervision}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="font-display text-4xl md:text-5xl">How it works</h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s}><span className="font-display text-5xl text-accent">{i + 1}</span><p className="mt-3 font-medium">{s}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <Enquiry />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground">
          <span><span className="font-display text-lg text-primary">Rama Cares</span> · Hyderabad</span>
          <Link to="/console" className="hover:text-primary">Staff console</Link>
        </div>
      </footer>
    </div>
  );
}

function Enquiry() {
  const [f, setF] = useState({ name: "", age: "", condition: "", guardian: "", guardianPhone: "", serviceLine: "Post-hospitalisation" as Patient["serviceLine"] });
  const [sent, setSent] = useState(false);
  const field = "w-full border-b border-border bg-transparent py-3 outline-hidden placeholder:text-muted-foreground focus:border-primary";
  return (
    <section id="enquire" className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-4xl md:text-5xl">Request a home assessment.</h2>
        <p className="mt-4 max-w-md text-muted-foreground">Tell us a little about your parent. A care advisor will call you back, and a nurse will assess within 24 hours.</p>
      </div>
      {sent ? (
        <div className="rounded-2xl bg-card p-10 shadow-sm">
          <h3 className="font-display text-2xl">Thank you.</h3>
          <p className="mt-2 text-muted-foreground">We've received your request and will call you shortly.</p>
        </div>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          update((s) => ({ ...s, patients: [...s.patients, { id: uid(), ...f, age: Number(f.age) || 0, journeyStep: 1, tier: null, caregiverId: null, backupId: null, careStart: null, lastNurseVisit: null }] }));
          setSent(true);
        }}>
          <input required className={field} placeholder="Patient's name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={field} placeholder="Age" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <input className={`${field} sm:col-span-2`} placeholder="Condition, hospital and discharge date" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} />
          <input required className={field} placeholder="Your name" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} />
          <input required className={field} placeholder="Phone / WhatsApp" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} />
          <select className={`${field} sm:col-span-2`} value={f.serviceLine} onChange={(e) => setF({ ...f, serviceLine: e.target.value as Patient["serviceLine"] })}>
            <option>Post-hospitalisation</option><option>Elderly care</option><option>Rehabilitation</option>
          </select>
          <button className="mt-4 rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground hover:bg-primary/90 sm:col-span-2 sm:justify-self-start">Request assessment</button>
        </form>
      )}
    </section>
  );
}
