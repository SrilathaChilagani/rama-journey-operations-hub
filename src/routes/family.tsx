import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Activity, CalendarCheck, CheckCircle2, HeartHandshake, LogOut, MessageCircle, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOURNEY, TIERS, nextNurseVisitDue, type Severity } from "@/lib/care-rules";
import { whatsappLink } from "@/lib/enquiry";
import { SITE_CONFIG } from "@/lib/site-config";
import {
  familyConsent, familyMe, familyRaiseConcern, familyResend, familySignOut, familyStart, familyVerify, familyView,
  type FamilyLink, type FamilyView,
} from "@/lib/api/family";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: "Family portal — Rama Cares" },
      { name: "description", content: "Daily care reports, care team and nurse visits for families of Rama Cares patients." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FamilyPortal,
});

const field = "mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-hidden placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary";
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
const dateTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const longDate = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

function FamilyPortal() {
  // undefined = checking; [] = signed out (or no access); otherwise linked patients
  const [links, setLinks] = useState<FamilyLink[] | undefined>(undefined);
  const refresh = () => familyMe().then(setLinks, () => setLinks([]));
  useEffect(() => {
    void refresh();
  }, []);
  const signOut = async () => {
    await familySignOut().catch(() => undefined);
    setLinks([]);
  };
  const signedIn = !!links && links.length > 0;
  return (
    <div className="patient-home min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="home-container flex h-20 items-center justify-between gap-4">
          <Link to="/" aria-label="Rama Cares home" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><HeartHandshake className="size-6" strokeWidth={1.7} /></span>
            <span className="text-[23px] font-semibold">rama<span className="font-normal text-primary">cares</span><span className="block text-[9px] font-medium uppercase leading-3 text-muted-foreground">Family portal</span></span>
          </Link>
          {signedIn && (
            <Button variant="ghost" className="rounded-full text-xs" onClick={signOut}><LogOut /> Sign out</Button>
          )}
        </div>
      </header>
      <main>
        {links === undefined ? (
          <div className="home-container py-24 text-sm text-muted-foreground">Loading…</div>
        ) : !signedIn ? (
          <SignIn onSignedIn={refresh} />
        ) : !links.every((l) => l.consented) ? (
          <Consent name={links[0]!.contactName} onAgree={async () => { await familyConsent(); await refresh(); }} onDecline={signOut} />
        ) : (
          <Portal links={links} />
        )}
      </main>
      <footer className="border-t border-border">
        <div className="home-container flex flex-wrap items-center justify-between gap-4 py-8 text-xs text-muted-foreground">
          <p>Rama Cares · Nurse-led home care · Hyderabad</p>
          <Link to="/" className="hover:text-primary">Rama Cares website</Link>
        </div>
      </footer>
    </div>
  );
}

// ---------- Sign-in: phone → SMS code ----------
function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await familyStart({ data: { phone } });
      if (res.status === "code-sent") setHint(res.phoneHint);
      else if (res.reason === "bad-number") setError("Please enter your mobile number with its country code, e.g. +1 408 555 0142. Indian numbers can skip +91.");
      else if (res.reason === "too-many") setError("Too many code requests for this number. Please try again in an hour.");
      else setError("We couldn't send a code just now. Please try again shortly.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="home-container grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-20">
      <div>
        <p className="home-eyebrow">For families</p>
        <h1 className="home-heading mt-3">Stay close to their care,<br />wherever you are.</h1>
        <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">See today's care report, who is caring for your parent, when the nurse visits next — and tell us if anything worries you.</p>
        <ul className="mt-7 space-y-3 text-sm">
          {[[Activity, "Daily care reports"], [UserRound, "Your caregiver and named backup"], [Stethoscope, "Nurse supervision visits"], [MessageCircle, "Raise a concern any time"]].map(([Icon, t]) => {
            const I = Icon as typeof Activity;
            return <li key={String(t)} className="flex items-center gap-3"><I className="size-4 text-primary" strokeWidth={1.6} />{String(t)}</li>;
          })}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 md:p-8">
        {hint ? (
          <CodeEntry hint={hint} onSignedIn={onSignedIn} onRestart={() => setHint(null)} />
        ) : (
          <form onSubmit={submit}>
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use the mobile number you gave our care team. We'll text you a 6-digit code.</p>
            <label className="mt-6 block text-xs font-medium">Mobile number
              <input required type="tel" autoComplete="tel" inputMode="tel" className={field} placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || phone.trim().length < 6} className="mt-5 h-12 w-full rounded-full">{busy ? "Sending…" : "Send me a code"}</Button>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" /> Only family members our team has added can sign in.</p>
          </form>
        )}
      </div>
    </section>
  );
}

const CODE_LENGTH = 6;
type OtpNavigator = { credentials: { get(o: unknown): Promise<{ code?: string } | null> } };

// Autofill: `one-time-code` lets iPhone and Android keyboards offer the code from the SMS; Web OTP
// fills it automatically on Android Chrome when the SMS carries the site's "@domain #code" line.
function CodeEntry({ hint, onSignedIn, onRestart }: { hint: string; onSignedIn: () => void; onRestart: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);
  const tried = useRef<string | null>(null);
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    const ac = new AbortController();
    (navigator as unknown as OtpNavigator).credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal })
      .then((otp) => otp?.code && setCode(otp.code.replace(/\D/g, "").slice(0, CODE_LENGTH)))
      .catch(() => undefined);
    return () => ac.abort();
  }, []);
  const verify = async (value: string) => {
    if (busy || tried.current === value) return;
    tried.current = value;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await familyVerify({ data: { code: value } });
      if (res.status === "signed-in") return onSignedIn();
      if (res.reason === "expired") {
        setError("This code has expired or had too many tries. Please start again.");
        window.setTimeout(onRestart, 2500);
      } else {
        setError("That code isn't right. Please check the message and try again.");
        setCode("");
      }
    } catch {
      setError("Couldn't check the code. Please try again.");
      tried.current = null;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (code.length === CODE_LENGTH) void verify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const resend = async () => {
    setError(null);
    const res = await familyResend().catch(() => null);
    if (res?.status === "code-sent") {
      setNotice("A new code is on its way.");
      setWait(30);
      tried.current = null;
    } else if (res?.reason === "too-many" || res?.reason === "expired") {
      setError("No more codes for this attempt. Please start again.");
      window.setTimeout(onRestart, 2500);
    } else setError("Couldn't send a new code yet. Please wait a moment.");
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); tried.current = null; void verify(code); }}>
      <h2 className="text-xl font-semibold">Enter your code</h2>
      <p className="mt-2 text-sm text-muted-foreground">If {hint} is registered with us, a 6-digit code is on its way by SMS.</p>
      <label className="mt-6 block text-xs font-medium">Code
        <input name="code" required autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={CODE_LENGTH}
          placeholder="••••••" className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))} />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      <Button type="submit" disabled={busy || code.length !== CODE_LENGTH} className="mt-5 h-12 w-full rounded-full">{busy ? "Checking…" : "Sign in"}</Button>
      <div className="mt-4 flex justify-between text-xs">
        <button type="button" disabled={wait > 0} onClick={resend} className="text-primary underline disabled:text-muted-foreground disabled:no-underline">{wait > 0 ? `Resend in ${wait}s` : "Resend code"}</button>
        <button type="button" onClick={onRestart} className="text-muted-foreground underline">Use a different number</button>
      </div>
    </form>
  );
}

// ---------- First sign-in consent (DPDP) ----------
function Consent({ name, onAgree, onDecline }: { name: string; onAgree: () => Promise<void>; onDecline: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="home-container py-14 md:py-20">
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 md:p-8">
        <p className="home-eyebrow">Welcome, {name}</p>
        <h1 className="mt-3 text-2xl font-semibold">Before you continue</h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>This portal shows health information about your family member: daily care notes, vital signs, medicines, incidents and their care team.</p>
          <p>Rama Cares shares it with you because our care team added you as their family contact. Please keep it private and don't share your sign-in code.</p>
          <p>You can ask us to remove your access at any time.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button className="h-11 rounded-full px-6" disabled={busy} onClick={async () => { setBusy(true); await onAgree().finally(() => setBusy(false)); }}>I understand — continue</Button>
          <Button variant="ghost" className="h-11 rounded-full" onClick={onDecline}>Not now</Button>
        </div>
      </div>
    </section>
  );
}

// ---------- The portal ----------
function Portal({ links }: { links: FamilyLink[] }) {
  const [patientId, setPatientId] = useState(links[0]!.patientId);
  const [view, setView] = useState<FamilyView | null>(null);
  const [error, setError] = useState(false);
  const load = () => familyView({ data: { patientId } }).then((v) => { setView(v); setError(false); }, () => setError(true));
  useEffect(() => {
    setView(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (error) return <div className="home-container py-24 text-sm text-destructive">We couldn't load this page. Please refresh, or sign in again.</div>;
  if (!view) return <div className="home-container py-24 text-sm text-muted-foreground">Loading…</div>;
  const p = view.patient;
  const step = JOURNEY[p.journeyStep - 1];
  const nextVisit = p.tier && p.careStart ? nextNurseVisitDue(p.tier, p.careStart, p.lastNurseVisit) : null;
  const wa = whatsappLink(SITE_CONFIG.whatsappNumber, `Hello Rama Cares, this is about ${p.name}.`);
  return (
    <>
      <section className="border-b border-border bg-home-surface">
        <div className="home-container py-10 md:py-14">
          {links.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Choose family member">
              {links.map((l) => (
                <button key={l.patientId} role="tab" aria-selected={l.patientId === patientId} onClick={() => setPatientId(l.patientId)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium ${l.patientId === patientId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                  {l.patientName}
                </button>
              ))}
            </div>
          )}
          <p className="home-eyebrow">Caring for</p>
          <h1 className="mt-2 text-[38px] font-medium leading-tight md:text-[48px]">{p.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{p.serviceLine}{p.tier && ` · ${TIERS[p.tier].name} care (${p.tier})`}{p.careStart && ` · with us since ${longDate(p.careStart)}`}</p>
          <div className="mt-7 max-w-2xl">
            <div className="flex gap-1.5" aria-hidden="true">
              {JOURNEY.map((j) => <div key={j.step} className={`h-1.5 flex-1 rounded-full ${j.step <= p.journeyStep ? "bg-primary" : "bg-border"}`} />)}
            </div>
            <p className="mt-3 text-sm"><span className="font-semibold">Step {p.journeyStep} of 8: {step?.name}.</span> <span className="text-muted-foreground">{p.journeyStep === 5 && p.lastNurseVisit ? "Care has started and the nurse has made the first visit." : STEP_COPY[p.journeyStep] ?? ""}</span></p>
          </div>
          {wa && <Button asChild variant="outline" className="mt-6 h-11 rounded-full bg-background px-5"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Message the care team</a></Button>}
        </div>
      </section>

      <section className="home-container grid gap-5 py-10 md:grid-cols-3">
        <TeamCard title="Caregiver" person={view.caregiver} empty="We'll introduce your caregiver once the care plan is agreed." />
        <TeamCard title="Named backup" person={view.backup} empty="A backup caregiver is introduced in the first week of care." />
        <InfoCard icon={Stethoscope} title="Nurse supervision">
          {p.tier ? (
            <>
              <p className="text-sm">{TIERS[p.tier].supervision}.</p>
              {p.lastNurseVisit && <p className="mt-2 text-xs text-muted-foreground">Last visit: {longDate(p.lastNurseVisit)}</p>}
              {nextVisit && <p className="mt-1 text-xs text-muted-foreground">Next visit due by: <span className="font-medium text-foreground">{longDate(nextVisit)}</span></p>}
              {!p.careStart && <p className="mt-2 text-xs text-muted-foreground">Visits begin once care starts — the first within 48 hours.</p>}
            </>
          ) : <p className="text-sm text-muted-foreground">A registered nurse will assess and set the level of care.</p>}
        </InfoCard>
      </section>

      <section className="home-container grid gap-10 pb-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Daily care reports</h2>
          <p className="mt-1 text-xs text-muted-foreground">Written by the caregiver during each shift.</p>
          <div className="mt-5 space-y-4">
            {view.logs.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Reports will appear here from the first day of care.</p>}
            {view.logs.map((l) => (
              <article key={l.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{dateFmt(l.date)}</h3>
                  {l.caregiver && <span className="text-xs text-muted-foreground">by {l.caregiver}</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.bp && <Chip label="Blood pressure" value={l.bp} />}
                  {l.spo2 && <Chip label="Oxygen" value={`${l.spo2}%`} />}
                  {l.mood && <Chip label="Mood" value={l.mood} />}
                </div>
                <dl className="mt-3 grid gap-1 text-sm">
                  {l.meals && <div><dt className="inline text-muted-foreground">Meals & fluids: </dt><dd className="inline">{l.meals}</dd></div>}
                  {l.meds && <div><dt className="inline text-muted-foreground">Medicines: </dt><dd className="inline">{l.meds}</dd></div>}
                </dl>
                {l.notes && <p className="mt-2 text-sm leading-6">{l.notes}</p>}
              </article>
            ))}
          </div>
        </div>
        <div className="space-y-10">
          <Concerns patientId={patientId} concerns={view.concerns} onRaised={load} />
          <div>
            <h2 className="text-xl font-semibold">Incidents</h2>
            <p className="mt-1 text-xs text-muted-foreground">Anything unusual, and how it's being handled. We call you straight away for anything urgent.</p>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
              {view.incidents.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nothing reported.</li>}
              {view.incidents.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span><SeverityDot s={i.severity} /> {i.kind} <span className="text-xs text-muted-foreground">· {dateFmt(i.at)}</span></span>
                  <span className={`text-xs ${i.resolved ? "text-primary" : "text-muted-foreground"}`}>{i.resolved ? "Resolved" : "Being handled"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

const STEP_COPY: Record<number, string> = {
  1: "We've received your request and will call you shortly.",
  2: "A registered nurse is assessing needs at home or in hospital.",
  3: "We're preparing the care plan and quote for you to approve.",
  4: "We're matching and introducing the right caregiver.",
  5: "Care has started. The first nurse visit is within 48 hours.",
  6: "The Care Manager is reviewing how the first days went.",
  7: "Ongoing care, supervised by a nurse on a fixed cycle.",
  8: "This care journey has been closed.",
};

function TeamCard({ title, person, empty }: { title: string; person: FamilyView["caregiver"]; empty: string }) {
  return (
    <InfoCard icon={UserRound} title={title}>
      {person ? (
        <>
          <p className="text-base font-semibold">{person.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{person.cadre}{person.languages && ` · speaks ${person.languages}`}</p>
        </>
      ) : <p className="text-sm text-muted-foreground">{empty}</p>}
    </InfoCard>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof Activity; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-4" strokeWidth={1.6} /></span><h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2></div>
      {children}
    </div>
  );
}

const Chip = ({ label, value }: { label: string; value: string }) => (
  <span className="rounded-full bg-secondary px-3 py-1 text-xs"><span className="text-muted-foreground">{label}</span> <span className="font-semibold">{value}</span></span>
);

const SeverityDot = ({ s }: { s: Severity }) => (
  <span title={s} aria-label={`${s} severity`} className={`mr-1 inline-block size-2 rounded-full ${s === "Red" ? "bg-destructive" : s === "Amber" ? "bg-warning" : "bg-success"}`} />
);

function Concerns({ patientId, concerns, onRaised }: { patientId: string; concerns: FamilyView["concerns"]; onRaised: () => void }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await familyRaiseConcern({ data: { patientId, text } });
      setText("");
      setState("sent");
      onRaised();
    } catch {
      setState("error");
    }
  };
  return (
    <div>
      <h2 className="text-xl font-semibold">Raise a concern</h2>
      <p className="mt-1 text-xs text-muted-foreground">We acknowledge within 2 hours and resolve it, or share a plan, within 48 hours.</p>
      <form onSubmit={submit} className="mt-4">
        <label className="sr-only" htmlFor="concern">Your concern</label>
        <textarea id="concern" required minLength={3} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Tell us what's worrying you" value={text} onChange={(e) => { setText(e.target.value); if (state !== "sending") setState("idle"); }} />
        <Button type="submit" disabled={state === "sending" || text.trim().length < 3} className="mt-3 h-11 rounded-full px-5">{state === "sending" ? "Sending…" : "Send to the Care Manager"}</Button>
        {state === "sent" && <p role="status" className="mt-2 flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="size-4" /> Sent. The Care Manager will be in touch.</p>}
        {state === "error" && <p role="alert" className="mt-2 text-sm text-destructive">That didn't send. Please try again.</p>}
      </form>
      {concerns.length > 0 && (
        <ul className="mt-5 space-y-3">
          {concerns.map((k) => (
            <li key={k.id} className="rounded-lg border border-border bg-card p-4 text-sm">
              <p>{k.text}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{k.raisedBy} · {dateTime(k.at)}</span>
                <span className="flex items-center gap-1"><CalendarCheck className="size-3.5" />
                  {k.resolvedAt ? `Resolved ${dateTime(k.resolvedAt)}` : k.acknowledgedAt ? `Acknowledged ${dateTime(k.acknowledgedAt)}` : "Received"}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
