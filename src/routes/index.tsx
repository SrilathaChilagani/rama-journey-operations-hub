import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, Heart, HeartHandshake, MapPin, Menu, MessageCircle, ShieldCheck, Stethoscope, Activity, Package, X } from "lucide-react";
import { getWeeklyPhoto, HOME_PHOTOS } from "@/lib/home-photos";
import { Button } from "@/components/ui/button";
import { TIERS, type Tier } from "@/lib/care-rules";
import { SERVICES } from "@/lib/services";
import { formatEnquiry, whatsappLink, type Enquiry as EnquiryInput } from "@/lib/enquiry";
import { submitEnquiry } from "@/lib/api/enquiries";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Rama Cares — Nurse-led home care in Hyderabad" },
    { name: "description", content: "Trained caregivers and nurses at home after hospital and for elderly parents in Hyderabad. Nurse-assessed, supervised, with a daily report to family anywhere in the world." },
    { property: "og:title", content: "Rama Cares — Nurse-led home care in Hyderabad" },
    { property: "og:description", content: "Care with the attention your own children would give — supervised by nurses, reported to you daily." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
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
const SERVICE_ICONS = [Stethoscope, HeartHandshake, Activity, Package];
const NAV = [["Services", "#services"], ["Our promise", "#promise"], ["How it works", "#how"]];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroPhoto, setHeroPhoto] = useState<(typeof HOME_PHOTOS)[number]>(HOME_PHOTOS[0]);
  useEffect(() => {
    const refreshPhoto = () => setHeroPhoto(getWeeklyPhoto(new Date()));
    refreshPhoto();
    const timer = window.setInterval(refreshPhoto, 60_000);
    window.addEventListener("focus", refreshPhoto);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshPhoto);
    };
  }, []);
  return (
    <div className="patient-home bg-background text-foreground">
      <header className="relative z-20 border-b border-border bg-background">
        <div className="home-container flex h-20 items-center justify-between gap-4">
          <a href="#" aria-label="Rama Cares home" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><HeartHandshake className="size-6" strokeWidth={1.7} /></span>
            <span className="text-[23px] font-semibold">rama<span className="font-normal text-primary">cares</span><span className="block text-[9px] font-medium uppercase leading-3 text-muted-foreground">Care that feels like family</span></span>
          </a>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-medium md:flex">
            {NAV.map(([label, href]) => <a key={label} href={href} className="transition-colors hover:text-primary">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden h-10 rounded-full px-5 text-xs sm:inline-flex"><a href="#enquire">Book an assessment <ArrowRight /></a></Button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && <nav aria-label="Mobile navigation" className="absolute inset-x-0 top-20 flex flex-col gap-1 border-b border-border bg-background px-6 py-4 shadow-sm">{NAV.map(([label, href]) => <Button key={label} asChild variant="ghost" className="justify-start"><a href={href} onClick={() => setMenuOpen(false)}>{label}</a></Button>)}<Button asChild className="mt-2"><a href="#enquire" onClick={() => setMenuOpen(false)}>Book an assessment <ArrowRight /></a></Button></nav>}
      </header>

      <main>
        <section className="home-hero relative overflow-hidden bg-home-surface">
          <img src={heroPhoto.src} alt={heroPhoto.alt} width={1672} height={941} fetchPriority="high" className="home-hero-image absolute inset-0 h-full w-full object-cover" />
          <div className="home-container relative z-10 flex h-full items-center">
            <div className="home-hero-copy max-w-[470px] py-12">
              <p className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase text-primary"><span className="size-1.5 rounded-full bg-primary" /> Nurse-led home care in Hyderabad</p>
              <h1 className="text-[48px] font-medium leading-[1.08] xl:text-[60px]">Rama Cares.<br />Expert care.<br /><span className="text-primary">Right at home.</span></h1>
              <p className="mt-5 max-w-[340px] text-sm leading-6 text-muted-foreground">For the people who mean everything to you. Compassionate caregivers, supervised by nurses, with daily updates to your family.</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button asChild className="h-12 rounded-full px-6"><a href="#enquire">Request an assessment <ArrowRight /></a></Button>
                <a href="#services" className="inline-flex items-center gap-2 text-xs font-semibold">Explore care <ArrowDown className="size-3.5" /></a>
              </div>
              <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5 text-primary" /> Nurse assessed. Family approved.</p>
            </div>
          </div>
        </section>

        <section aria-label="Our care standards" className="border-b border-border bg-background">
          <div className="home-container grid grid-cols-2 gap-x-5 gap-y-5 py-6 md:grid-cols-4">
            {[[ShieldCheck, "Nurse-supervised care", "Clinical oversight, always"], [Heart, "Care, not just placement", "A plan built around your family"], [MessageCircle, "Daily family updates", "Stay close, wherever you are"], [MapPin, "At home in Hyderabad", "Familiar surroundings. Better care."]].map(([Icon, title, detail]) => {
              const TrustIcon = Icon as typeof ShieldCheck;
              return <div key={String(title)} className="flex items-center gap-3"><TrustIcon className="size-5 shrink-0 text-primary" strokeWidth={1.5} /><div><p className="text-[11px] font-semibold">{String(title)}</p><p className="mt-1 text-[10px] text-muted-foreground">{String(detail)}</p></div></div>;
            })}
          </div>
        </section>

        <section id="services" className="home-container pb-16 pt-10 md:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="home-eyebrow">Care for every chapter</p><h2 className="home-heading mt-3">A little support.<br className="sm:hidden" /> A world of difference.</h2></div>
            <p className="max-w-[300px] text-sm leading-6 text-muted-foreground">From recovering after hospital to everyday companionship. Find care that fits your family.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => {
              const Icon = SERVICE_ICONS[i] ?? Heart;
              return <Link key={s.slug} to="/services/$slug" params={{ slug: s.slug }} className="home-service group flex min-h-[265px] flex-col rounded-lg border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
                <div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-5" strokeWidth={1.5} /></span><span className="text-[10px] text-muted-foreground">0{i + 1}</span></div>
                <h3 className="mt-6 text-lg font-semibold">{s.name}</h3><p className="mb-6 mt-2 text-xs leading-5 text-muted-foreground">{s.short}</p>
                <span className="mt-auto flex items-center justify-between text-xs font-semibold text-primary">Explore service <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>;
            })}
          </div>
        </section>

        <section id="promise" className="bg-home-ink text-home-on-ink">
          <div className="home-container grid gap-12 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div><p className="home-eyebrow text-home-soft">The Rama Cares difference</p><h2 className="home-heading mt-4">Warm hearts.<br />Clinical minds.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-home-soft">Not a placement agency. Every placement is led and supervised by a nurse — with the attention your own children would give.</p><Button asChild variant="outline" className="mt-7 h-11 rounded-full border-home-on-ink/30 bg-transparent text-home-on-ink hover:bg-home-on-ink/10 hover:text-home-on-ink"><a href="#enquire">Let's talk about your family <ArrowRight /></a></Button></div>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">{PROMISES.map(([title, detail]) => <div key={title} className="border-t border-home-on-ink/20 pt-5"><CheckCircle2 className="mb-3 size-5 text-home-soft" strokeWidth={1.5} /><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-6 text-home-soft">{detail}</p></div>)}</div>
          </div>
        </section>

        <section className="home-container py-16 md:py-20">
          <p className="home-eyebrow">Personal, never one-size-fits-all</p><h2 className="home-heading mt-3">The right care. Not more. Not less.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Your nurse sets the level of care after an assessment — never a sales call. So your parent gets someone trained for what they need.</p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(TIERS) as Tier[]).map((t) => <div key={t} className="border-t-2 border-primary/30 pt-5"><span className="text-[10px] font-semibold text-primary">{t}</span><h3 className="mt-2 text-base font-semibold">{TIERS[t].name}</h3><p className="mt-3 text-xs leading-6 text-muted-foreground">{TIERS[t].staff}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{TIERS[t].supervision}</p></div>)}</div>
        </section>

        <section id="how" className="border-y border-border bg-secondary">
          <div className="home-container py-16 md:py-20"><p className="home-eyebrow">A reassuring start</p><h2 className="home-heading mt-3">From the first hello, we're with you.</h2><ol className="mt-10 grid gap-7 sm:grid-cols-2 md:grid-cols-5">{STEPS.map((s, i) => <li key={s} className="relative"><span className="flex size-9 items-center justify-center rounded-full border border-primary/25 text-xs font-semibold text-primary">0{i + 1}</span><p className="mt-4 max-w-[170px] text-sm font-medium leading-6">{s}</p></li>)}</ol></div>
        </section>
        <Enquiry />
      </main>

      <footer className="border-t border-border"><div className="home-container flex flex-wrap items-center justify-between gap-6 py-8"><div><p className="text-xl font-semibold">rama<span className="font-normal text-primary">cares</span></p><p className="mt-2 text-xs text-muted-foreground">Nurse-led home care · Hyderabad</p></div><div className="flex flex-wrap gap-6 text-xs text-muted-foreground"><a href="#services" className="hover:text-primary">Our services</a><a href="#enquire" className="hover:text-primary">Get in touch</a><Link to="/family" className="hover:text-primary">Family portal</Link><Link to="/privacy" className="hover:text-primary">Privacy</Link></div></div></footer>
    </div>
  );
}

function Enquiry() {
  const [f, setF] = useState<EnquiryInput>({ name: "", age: "", condition: "", guardian: "", guardianPhone: "", serviceLine: "Post-hospitalisation", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "too-many">("idle");
  const [repeat, setRepeat] = useState(false);
  const wa = whatsappLink(SITE_CONFIG.whatsappNumber, formatEnquiry(f));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await submitEnquiry({ data: f });
      if (!res.ok) return setStatus("too-many");
      setRepeat(!!res.repeat);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };
  const waButton = wa && <Button asChild variant="outline" className="mt-5 h-11 self-start rounded-full px-5"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle /> Message us on WhatsApp</a></Button>;
  const field = "mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-hidden placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary";
  const label = "text-xs font-medium";
  return (
    <section id="enquire" className="home-container grid gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-20">
      <div><p className="home-eyebrow">Let's find the right care</p><h2 className="home-heading mt-3">Your family.<br />Our full attention.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Tell us a little about your parent. A care advisor will call you back, and a nurse will assess within 24 hours.</p><div className="mt-7 flex items-center gap-2 text-xs text-primary"><ShieldCheck className="size-4" /> Every care journey begins with a nurse assessment.</div></div>
      {status === "sent" ? <div role="status" className="flex flex-col justify-center border-t border-primary pt-8"><CheckCircle2 className="size-10 text-primary" strokeWidth={1.5} /><h3 className="mt-5 text-2xl font-semibold">Thank you.</h3><p className="mt-2 text-sm text-muted-foreground">{repeat ? "We already have your earlier request and will call you shortly — no need to send it again." : "We've received your request and will call you shortly."}{wa ? " For a faster reply, send us the same details on WhatsApp." : ""}</p>{waButton}</div> : <form className="grid gap-x-4 gap-y-5 sm:grid-cols-2" onSubmit={submit}>
        <label className={label}>Patient's name<input required autoComplete="name" className={field} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className={label}>Age<input className={field} inputMode="numeric" placeholder="Patient's age" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></label>
        <label className={`${label} sm:col-span-2`}>Care needs<input className={field} placeholder="Condition, hospital and discharge date" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })} /></label>
        <label className={label}>Your name<input required className={field} placeholder="Full name" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} /></label>
        <label className={label}>Phone / WhatsApp<input required type="tel" autoComplete="tel" className={field} placeholder="Your contact number" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} /></label>
        <label className={`${label} sm:col-span-2`}>Service<select className={field} value={f.serviceLine} onChange={(e) => setF({ ...f, serviceLine: e.target.value as EnquiryInput["serviceLine"] })}><option>Post-hospitalisation</option><option>Elderly care</option><option>Rehabilitation</option></select></label>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
        <Button type="submit" disabled={status === "sending"} className="mt-1 h-12 rounded-full px-6 sm:col-span-2 sm:justify-self-start">{status === "sending" ? "Sending…" : <>Request assessment <ArrowRight /></>}</Button>
        <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">We use these details only to arrange care for your family. See our <Link to="/privacy" className="underline hover:text-primary">privacy policy</Link>.</p>
        {status === "too-many" && <div role="alert" className="flex flex-col text-sm text-destructive sm:col-span-2"><p>We've received several requests from this connection in the last hour. Please try again a little later{wa ? ", or send it to us on WhatsApp" : ""}.</p>{waButton}</div>}
        {status === "error" && <div role="alert" className="flex flex-col text-sm text-destructive sm:col-span-2"><p>We couldn't send your request just now. Please check your details and try again{wa ? ", or send it to us on WhatsApp" : ""}.</p>{waButton}</div>}
      </form>}
    </section>
  );
}
