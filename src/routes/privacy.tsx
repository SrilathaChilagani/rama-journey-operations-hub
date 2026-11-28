import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HeartHandshake } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Rama Cares" },
      { name: "description", content: "How Rama Cares collects, uses and protects personal and health information, and your rights under India's DPDP Act." },
      { property: "og:title", content: "Privacy policy — Rama Cares" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Privacy,
});

const c = SITE_CONFIG;
const business = c.legalName || "Rama Cares";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function Contact() {
  const lines = [
    c.grievanceOfficerName && `Grievance officer: ${c.grievanceOfficerName}`,
    c.privacyEmail && `Email: ${c.privacyEmail}`,
    c.privacyPhone && `Phone: ${c.privacyPhone}`,
    c.address && `Address: ${c.address}`,
  ].filter(Boolean);
  if (lines.length === 0)
    return <p>Our grievance officer's contact details will be listed here. Until then, tell us through the <Link to="/family" className="underline hover:text-primary">family portal</Link> (raise a concern) or the <a href="/#enquire" className="underline hover:text-primary">contact form</a>, and our team will respond.</p>;
  return <ul className="list-none space-y-1">{lines.map((l) => <li key={l}>{l}</li>)}</ul>;
}

function Privacy() {
  return (
    <div className="patient-home min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="home-container flex h-20 items-center">
          <Link to="/" aria-label="Rama Cares home" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><HeartHandshake className="size-6" strokeWidth={1.7} /></span>
            <span className="text-[23px] font-semibold">rama<span className="font-normal text-primary">cares</span></span>
          </Link>
        </div>
      </header>
      <main className="home-container max-w-3xl py-14 md:py-20">
        <p className="home-eyebrow">Privacy policy</p>
        <h1 className="home-heading mt-3">How we look after your family's information</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated {c.privacyUpdated}</p>
        <p className="mt-6 text-[15px] leading-7 text-muted-foreground">
          {business} provides nurse-led home care in Hyderabad. Caring for someone at home means we hold personal and health
          information about them and their family. This page explains what we collect, why, who can see it, and your rights under
          India's Digital Personal Data Protection Act, 2023.
        </p>

        <Section title="What we collect">
          <p><strong className="font-medium text-foreground">When you ask about care</strong> (the form on our website): the patient's name, age and care needs, and your name and phone number.</p>
          <p><strong className="font-medium text-foreground">When we provide care:</strong> the patient's care plan, nurse assessments and visits, daily care notes (vital signs such as blood pressure and oxygen level, meals, medicines, mood), incidents and complaints, and which caregiver and nurse look after them.</p>
          <p><strong className="font-medium text-foreground">About family contacts:</strong> name, relationship to the patient, mobile number, when you agreed to this policy in the family portal, and which WhatsApp updates you've chosen to receive.</p>
          <p><strong className="font-medium text-foreground">Technical information:</strong> sign-in cookies that keep you signed in to the family portal, and a scrambled (one-way encoded) form of your internet address that we use only to stop spam on our contact form. We don't keep the address itself.</p>
        </Section>

        <Section title="Why we use it">
          <p>To arrange and provide care: calling you back, assessing the patient, matching and supervising caregivers, keeping care records, and handling incidents and complaints in line with our care standards.</p>
          <p>To keep families informed: the family portal, and WhatsApp messages with the daily care report and urgent incident updates. You can switch these messages off in the portal at any time.</p>
          <p>To keep our services secure and working: sign-in codes by SMS, spam protection, and error reports when something on the site breaks.</p>
          <p>We never sell your information or use it for advertising.</p>
        </Section>

        <Section title="Your consent">
          <p>By sending the contact form, you agree that we may use those details to contact you about care. The first time a family member signs in to the family portal, we ask them to agree before showing any health information.</p>
          <p>The family member who arranges care gives consent on behalf of the patient where the patient can't do so themselves. If care is for someone under 18, a parent or legal guardian must give consent.</p>
          <p>You can withdraw consent at any time (see "Your rights" below). Withdrawing doesn't affect what we did before, but we may not be able to continue care without the information we need to provide it safely.</p>
        </Section>

        <Section title="Who can see it">
          <p><strong className="font-medium text-foreground">Our care team:</strong> care managers, nurses and caregivers see what they need to care for the patient. Staff sign in with a personal password and a one-time SMS code.</p>
          <p><strong className="font-medium text-foreground">Family contacts:</strong> only people our care team has added for that patient, after signing in with their own mobile number. Our team can remove access at any time.</p>
          <p><strong className="font-medium text-foreground">Service providers</strong> who run parts of our service for us, only for that purpose:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Neon: database where records are stored</li>
            <li>Vercel: hosts this website</li>
            <li>Twilio: sends sign-in codes by SMS and messages on WhatsApp (WhatsApp is run by Meta)</li>
            <li>Resend: sends email alerts to our staff</li>
            <li>Sentry: tells us when something on the website breaks</li>
            <li>Google Fonts: serves the fonts this website uses</li>
          </ul>
          <p>We may also share information when the law requires it, or in an emergency to protect someone's life or health (for example, with a hospital or ambulance service).</p>
        </Section>

        <Section title="Where it is stored">
          <p>Our service providers store and process information on secure servers that may be outside India, including in Singapore and the United States. We use providers that protect data with encryption and access controls.</p>
        </Section>

        <Section title="How long we keep it">
          <p>We keep care records for as long as we provide care, and afterwards for as long as medical record-keeping and other laws require. If an enquiry doesn't lead to care, you can ask us to delete it. When a family member's portal access is removed, they can no longer see any information.</p>
        </Section>

        <Section title="How we protect it">
          <p>All connections to this website are encrypted. Families sign in with one-time SMS codes, and staff with a password plus an SMS code; we store only scrambled forms of sign-in tokens and passwords, never the originals. Access to records is limited to people who need it to provide care, and we record which staff member added each care record.</p>
        </Section>

        <Section title="Your rights">
          <p>Under the DPDP Act you can ask us to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>tell you what personal information we hold about you and who we've shared it with;</li>
            <li>correct or complete information that is wrong or out of date;</li>
            <li>delete your information, where we don't have to keep it by law;</li>
            <li>withdraw your consent, or stop WhatsApp updates (you can also do this yourself in the family portal);</li>
            <li>name someone to exercise these rights for you if you die or can't act yourself.</li>
          </ul>
          <p>Contact our grievance officer (below). If you're not satisfied with our response, you can complain to the Data Protection Board of India.</p>
        </Section>

        <Section title="Cookies">
          <p>We use only the cookies needed to keep you signed in. We don't use advertising or tracking cookies.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>If we change how we use information, we'll update this page and the date at the top. If a change affects family contacts, we'll tell you before it takes effect.</p>
        </Section>

        <Section title="Contact us">
          <Contact />
        </Section>

        <p className="mt-14 text-sm"><Link to="/" className="text-primary underline">← Back to Rama Cares</Link></p>
      </main>
    </div>
  );
}
