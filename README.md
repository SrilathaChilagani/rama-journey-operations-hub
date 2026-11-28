# Rama Cares — operations platform & patient website

Nurse-led home care in Hyderabad. This repository holds one TanStack Start app that serves
two audiences from the same codebase:

- **Patient/family website** at `/` — services, the care promise, and an assessment request form.
- **Staff operations console** at `/console` — the SOP workflow: patients through their journey,
  caregiver roster, daily shift logs, incidents and complaints.

Both read and write the same data, so a family enquiry submitted on the public site appears
immediately in the staff console.

The business rules come from the owner's SOP document ("Rama Cares — Business Structure &
Standard Operating Procedures"). Those rules are code, not prose — see
[SOP rules](#sop-rules-implemented-in-code).

---

## Run it

```sh
npm i            # or: bun install
npm run dev      # dev server
npm run build    # production build
npm test         # vitest, 13 tests across 4 files
npm run lint     # eslint
npm run format   # prettier
```

Typecheck with `npx tsc --noEmit` (the harness also runs it).

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, Vite 8), file-based routing in `src/routes/` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, theme tokens in `src/styles.css` |
| Components | shadcn/ui primitives in `src/components/ui/`, app shell in `src/components/rc/` |
| State/data | Neon Postgres via server functions (`src/lib/api/`); client cache in `src/lib/store.ts` — see [Data](#data) |
| Hosting | Vercel (project `rama-journey-operations-hub`), GitHub `main` auto-deploys |
| Tests | Vitest + Testing Library, jsdom; `src/test/setup.ts` |
| Fonts | Fraunces (display), Inter (sans), Manrope (patient home) — loaded in `src/routes/__root.tsx` |

**Backend (ADR-007/008):** a dedicated Neon Postgres database for Rama Cares (separate from
telemed-in). Server-only code lives in `src/server/` (`db.ts`, `auth.ts`, `password.ts`);
server functions the pages call live in `src/lib/api/`. `DATABASE_URL` comes from Vercel env
vars in production and from the git-ignored `.env.local` locally. Schema changes are numbered
SQL files in `db/migrations/`, applied with `bun run db:migrate`.

---

## Pages

| Route | File | What it is |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Patient-facing home: hero photo, care promises, four service cards, standards, tier explainer, how-it-works, assessment form, footer |
| `/services/$slug` | `src/routes/services.$slug.tsx` | Detail page per service: what's included, who is sent, nurse supervision, onboarding steps, FAQs, related services |
| `/family` | `src/routes/family.tsx` | **Family portal** (homepage styling): guardian signs in with phone + SMS code; sees journey step, caregiver + backup, nurse schedule, daily reports, incident status; raises concerns |
| `/notifications` | `src/routes/notifications.tsx` | Log of every WhatsApp/email sent (staff alerts, family updates) with status and failure reason |
| `/enquiries` | `src/routes/enquiries.tsx` | Website assessment requests from the database; mark new / contacted / closed |
| `/console` | `src/routes/console.tsx` | Staff overview: active patients, awaiting assessment, bench count, open incidents, nurse visits due |
| `/patients` | `src/routes/patients.tsx` | Patient list + new enquiry form; journey step, tier, caregiver assignment (gated) |
| `/caregivers` | `src/routes/caregivers.tsx` | Roster by cadre, tier qualification, Deployed / Bench / Training |
| `/shifts` | `src/routes/shifts.tsx` | Daily care log: vitals, meals, medicines, mood, notes; copyable guardian summary |
| `/incidents` | `src/routes/incidents.tsx` | Red/Amber/Green escalation cards, incident logging, complaints with deadlines |

Service slugs (`src/lib/services.ts`): `after-hospital-stay`, `elderly-care`, `rehabilitation`,
`equipment-and-supplies`. An unknown slug throws `notFound()`.

The staff console is **not linked** from the public site and its pages send `noindex, nofollow`.
`AppShell` wraps every console page in a **staff sign-in** (email + password). Passwords are
scrypt-hashed in `staff_users`; a successful login sets an httpOnly `rc_staff` cookie whose
SHA-256 is stored in `staff_sessions` (30 days). 5 wrong passwords lock the account for 15 min.
Every staff server function calls `requireStaff()`. Page content mounts only after sign-in, so
data fetches never run unauthenticated. Create or reset a login (password typed at a hidden
prompt): `bun run staff:create you@example.com "Full Name" admin`.

**SMS sign-in code (ADR-009).** Staff with a mobile number on file must also enter a 6-digit
code sent by **Twilio Verify** (Rama Cares' own Twilio subaccount). Twilio creates and checks the
code — nothing about it is stored here. The pending sign-in is an httpOnly `rc_challenge`
cookie (10 min, 5 code tries, 2 resends ≥30 s apart). "Trust this device for 30 days" sets
`rc_trusted` and skips the SMS step (never the password); signing out keeps it. If a number is
on file but Twilio isn't configured, sign-in **fails closed**. Staff without a number sign in
with password only. Code entry autofills: `autocomplete="one-time-code"` (iOS/Android
keyboards) plus the Web OTP API on Android Chrome; a full code submits itself.
Set/clear a number: `bun run staff:phone you@example.com +919876543210` (or `none`).
Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
(`TWILIO_VERIFY_BASE_URL` is a local-testing override, ignored in production).

## Family portal (ADR-011)

- Staff grant access per patient on `/patients` → **Family portal access** (name, relationship,
  mobile; numbers normalised to E.164 by `src/lib/phone.ts`). Table `family_contacts`.
- Families sign in at `/family` with that number + an SMS code (Twilio Verify, same subaccount
  as staff). The "code sent" response is identical for unregistered numbers, which get no SMS
  and can never pass; max 5 code requests per number per hour; 5 code tries; 30-day
  `rc_family` session. First sign-in shows a consent notice (DPDP), stored as `consent_at`.
- Every portal read goes through `requireFamilyAccess(patientId)` (`src/server/family-auth.ts`),
  re-checked per request, so removing a contact ends access immediately. Families never see
  incident descriptions (staff notes) or other patients.
- Concerns raised in the portal become `complaints` rows with `raised_by_contact`, shown to
  staff tagged "from family" and run on the SOP's 2 h / 48 h deadlines.
- Server functions: `src/lib/api/family.ts`. Footer link "Family portal" on the homepage.

## Notifications (ADR-012)

`src/server/notify.ts` sends **WhatsApp** (Twilio Messages API, Rama Cares subaccount) and
**email** (Resend); wording lives in `src/lib/notify-messages.ts`. Every attempt is a row in
`notifications` (`sent` / `failed` + reason / `skipped` when a channel isn't configured) and a
failure never blocks the action that caused it.

| Trigger | Recipients |
| --- | --- |
| Website enquiry | Staff: `STAFF_ALERT_WHATSAPP`, `STAFF_ALERT_EMAILS` |
| Family concern (portal) | Staff, as above |
| Red/Amber incident (not Green) | Family contacts who consented in the portal and keep "Incident alerts" on — kind only, never staff notes |
| Daily care log saved | Family contacts who consented and keep "Daily care report" on |

Env: `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`, `STAFF_ALERT_EMAILS`, `TWILIO_WHATSAPP_FROM`,
`STAFF_ALERT_WHATSAPP`, `APP_BASE_URL` (falls back to Vercel's production URL). Sandbox
WhatsApp only reaches numbers that joined the sandbox, and free text only within 24 h of their
last message; for production set `TWILIO_WA_TEMPLATE_<KIND>` (approved Content SID, body passed
as `{{1}}`). Local-test overrides `TWILIO_API_BASE_URL`, `RESEND_BASE_URL` are ignored in
production.

## Business settings

`src/lib/site-config.ts` holds owner-supplied values that are safe to be public (never secrets):

- `whatsappNumber` — digits with country code; powers the "Message us on WhatsApp" button
  (prefilled with the enquiry) on the thank-you and error states. Empty → button hidden.

---

## SOP rules implemented in code

All in `src/lib/care-rules.ts`, tested in `src/lib/care-rules.test.ts`. UI pages call these
functions rather than re-stating the logic.

- **Tiers T1–T4** (`TIERS`) with the staff cadre each requires and the nurse supervision cycle:
  T1 Companion / Care Companion / monthly; T2 Personal care / Certified Caregiver / fortnightly;
  T3 Skilled support / Senior Caregiver or nurse / weekly; T4 Nursing / Registered Nurse /
  nurse lead + doctor on call.
- **Cadre qualification** (`CADRE_TIERS`, `cadreQualifies`) — a Care Companion cannot be sent to
  a T3 or T4 case; a Registered Nurse covers all four tiers.
- **Assignment gate** (`canAssignCaregiver`) — step 2 (home assessment) is the control point:
  no caregiver may be assigned until journey step ≥ 3 **and** a nurse has set a tier.
- **Nurse visit schedule** (`nextNurseVisitDue`) — first visit within 48 hours of care starting,
  then on the tier's cycle (30 / 14 / 7 / 7 days).
- **Complaint deadlines** (`complaintDeadlines`) — acknowledge within 2 hours, resolve or plan
  within 48 hours.
- **Escalation by rule** (`SEVERITY`) — Red: call 108, then family, then Care Manager, stay with
  the patient, guardian updated every 30 min; Amber: call Care Manager within 15 minutes;
  Green: log it and mention in the daily report.
- **8-step journey** (`JOURNEY`) — Enquiry → Home assessment → Care plan & quote → Match &
  introduce → Care starts → 48-hour review → Ongoing care → Closure, each with an owner.

---

## Data

**Database (Neon)** — everything is shared and server-side; nothing is kept in the browser:
`enquiries`, `patients`, `caregivers`, `shift_logs`, `incidents`, `complaints`, plus staff auth
tables (`staff_users`, `staff_sessions`, `staff_login_challenges`, `staff_trusted_devices`) and
`schema_migrations`. Records note which staff member created them (`created_by`,
`recorded_by`, `reported_by`, `logged_by`).

- `src/lib/api/console.ts` — one server function per console action. Each calls
  `requireStaff()` and re-checks SOP rules on the server with the same functions the UI uses
  (`advanceBlockReason`, `assignmentBlockReason`, `cadreQualifies`). The database also enforces
  the assignment gate (`patients_assignment_gate` check). Raising a tier drops a caregiver/backup
  who is no longer qualified.
- `src/lib/store.ts` — client cache: `AppShell` loads data after sign-in; pages read
  `useStore()!` (content mounts only once loaded) and change data with `run(serverFn)`, which
  shows a server refusal (e.g. an SOP rule) in a banner and reloads.
- An enquiry becomes a patient (step 1) with **Create patient record** on `/enquiries`.
- The public form validates with `enquirySchema` (`src/lib/enquiry.ts`) in the browser and on
  the server, with a hidden honeypot. No email/WhatsApp alert is sent yet.
- No demo data: the console starts empty.

---

## Homepage photos

`src/lib/home-photos.ts` holds a ten-photo collection and a deterministic weekly selector: the
hero shows a different photo each Monday at 00:00 India time (rotation anchored to
Mon 23 Nov 2026), cycling through all ten before repeating. The index is computed from the
clock, not stored, and the page hydrates the choice in an effect to avoid a server/client
mismatch. Photos are real files in `src/assets/*.jpg` imported directly (Lovable
asset pointers were removed — they 404 outside Lovable hosting). Adding a photo means adding a
file and one entry to `HOME_PHOTOS`;
the tests assert ten distinct entries and the weekly schedule.

---

## Conventions (read before editing)

- `src/lib/care-rules.ts` is the single source of truth for SOP behaviour. Change a rule there
  and update `care-rules.test.ts`; don't duplicate tier or deadline logic in a page.
- Prices, caregiver pay and headcounts are **[TO SET]** by the business owner. Never invent a
  number; the site says "quoted in writing after assessment".
- Patient-home styling tokens are scoped under `.patient-home` in `src/styles.css` so homepage
  refreshes can't disturb console styling. Keep new patient-home CSS inside that wrapper.
- `src/routeTree.gen.ts` is generated — never hand-edit it. Creating a route file is enough.
- Every content route sets its own `head()` metadata. Don't add `og:image`/`twitter:image` to
  `__root.tsx`.
- `src/routes/README.md` documents the file-based routing conventions for this stack.
- `AGENTS.md` carries Lovable's own guardrails (don't edit generated files, don't commit
  secrets, don't rewrite published history).

---

## Open items

1. **Go-live for messaging** — upgrade Twilio from Trial, register a Rama Cares WhatsApp sender
   and templates (Meta), verify the domain in Resend.
2. **Caregiver search + booking** — a "find care by area/PIN with a map" flow was built and
   then explicitly rolled back at the owner's request (`3a7957f`); it is not in the app. Any
   future version must still respect the assessment gate: searching is fine, confirming a
   caregiver is not, until step 2 is done.
3. **Prices and pay** — all still `[TO SET]`.
4. **Contact details** — phone/email/address for the public site are not final; the three
   WhatsApp number in `src/lib/site-config.ts` must be filled before going live.
   No notification is sent when an enquiry arrives yet (needs Rama Cares' own email/WhatsApp).
5. **Domain** — booked on Hostinger; connect it to Vercel (Project → Settings → Domains).
6. **Leave Lovable (Phase 2, ADR-007)** — replace `@lovable.dev/vite-tanstack-config`, Lovable
   error reporter, meta tags, `.lovable/` and the Lovable block in `AGENTS.md`.

---

## Built with Lovable

This project is developed in the [Lovable editor](https://lovable.dev/projects/11af10fd-04f2-4aa1-948b-ec650a369e19).
Every change made there is committed to this repository, and pushes to the connected branch
sync back into the editor. Keep the branch in a working state.

To work locally: `git clone <this-repository-url>`, `npm i`, `npm run dev`.
