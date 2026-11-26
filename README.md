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
npm test         # vitest, 8 tests across 3 files
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
| State/data | Custom browser-local store in `src/lib/store.ts` (localStorage) — see [Data](#data) |
| Tests | Vitest + Testing Library, jsdom; `src/test/setup.ts` |
| Fonts | Fraunces (display), Inter (sans), Manrope (patient home) — loaded in `src/routes/__root.tsx` |

There is **no database, no auth, and no server-side data** yet. Lovable Cloud could not be
enabled when this was built (workspace had no credits), so persistence is browser-local.
Migrating to Cloud tables is the single biggest open item.

---

## Pages

| Route | File | What it is |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Patient-facing home: hero photo, care promises, four service cards, standards, tier explainer, how-it-works, assessment form, footer |
| `/services/$slug` | `src/routes/services.$slug.tsx` | Detail page per service: what's included, who is sent, nurse supervision, onboarding steps, FAQs, related services |
| `/console` | `src/routes/console.tsx` | Staff overview: active patients, awaiting assessment, bench count, open incidents, nurse visits due |
| `/patients` | `src/routes/patients.tsx` | Patient list + new enquiry form; journey step, tier, caregiver assignment (gated) |
| `/caregivers` | `src/routes/caregivers.tsx` | Roster by cadre, tier qualification, Deployed / Bench / Training |
| `/shifts` | `src/routes/shifts.tsx` | Daily care log: vitals, meals, medicines, mood, notes; copyable guardian summary |
| `/incidents` | `src/routes/incidents.tsx` | Red/Amber/Green escalation cards, incident logging, complaints with deadlines |

Service slugs (`src/lib/services.ts`): `after-hospital-stay`, `elderly-care`, `rehabilitation`,
`equipment-and-supplies`. An unknown slug throws `notFound()`.

The staff console is reachable from the public footer link "Staff console" — it is **not**
protected by a login. Anyone with the URL can see and edit the demo data in their own browser.

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

`src/lib/store.ts` is the whole persistence layer:

- Types: `Patient`, `Caregiver`, `ShiftLog`, `Incident`, `Complaint`, `State`.
- A seeded demo dataset (4 caregivers, 3 patients, 1 shift log, 1 Amber incident) so the console
  is never empty.
- `useStore()` — React `useSyncExternalStore` hook; `update(fn)` — immutable write;
  `resetDemo()` — restore the seed; `uid()` and `fmt()` helpers.
- Everything is saved to localStorage under the key `rama-cares-v1`, per browser.

Consequences an agent must understand: data does **not** sync between devices or users; a new
visitor sees the seed, not what someone else entered; clearing browser storage resets everything.
The public enquiry form and the console's "New enquiry" both push a `Patient` with
`journeyStep: 1`, `tier: null`, no caregiver — which is exactly the SOP's step-1 state.

---

## Homepage photos

`src/lib/home-photos.ts` holds a ten-photo collection and a deterministic weekly selector: the
hero shows a different photo each Monday at 00:00 India time (rotation anchored to
Mon 23 Nov 2026), cycling through all ten before repeating. The index is computed from the
clock, not stored, and the page hydrates the choice in an effect to avoid a server/client
mismatch. Photos are Lovable asset pointers (`src/assets/*.asset.json`) whose `url` is a
project-relative path — they only resolve when served by Lovable, so a plain local clone shows
broken images. Adding a photo means adding an asset pointer and one entry to `HOME_PHOTOS`;
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

1. **Backend** — move `src/lib/store.ts` to real tables (Lovable Cloud) with auth for the
   console. This is the blocker for everything below.
2. **Caregiver search + booking** — a "find care by area/PIN with a map" flow was built and
   then explicitly rolled back at the owner's request (`3a7957f`); it is not in the app. Any
   future version must still respect the assessment gate: searching is fine, confirming a
   caregiver is not, until step 2 is done.
3. **Prices and pay** — all still `[TO SET]`.
4. **Contact details** — phone/email/address for the public site are not final.
5. **Domain** — a domain has been booked and will be connected later; nothing is configured.
6. **Photos are Lovable-hosted** — swap for repo-local files if the app is hosted elsewhere.

---

## Built with Lovable

This project is developed in the [Lovable editor](https://lovable.dev/projects/11af10fd-04f2-4aa1-948b-ec650a369e19).
Every change made there is committed to this repository, and pushes to the connected branch
sync back into the editor. Keep the branch in a working state.

To work locally: `git clone <this-repository-url>`, `npm i`, `npm run dev`.
