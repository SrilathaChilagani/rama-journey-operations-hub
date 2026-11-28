# Architectural Decisions

> ADR-style log. Append new decisions; supersede rather than rewrite.

## Format
```
## ADR-XXX: <Title>
- Date: YYYY-MM-DD
- Status: Proposed | Accepted | Superseded by ADR-YYY
- Context:
- Decision:
- Alternatives considered:
- Consequences:
```

---

## ADR-001: One app for patient website and staff console
- **Date:** 2026-11-23
- **Status:** Accepted
- **Context:** Families need a public site; staff need an SOP console; both share patient data.
- **Decision:** Single TanStack Start app. Public site at `/`, console moved to `/console` (`ce3a7de`).
- **Alternatives considered:** Two separate apps.
- **Consequences:** Enquiries flow straight into the console. Console must eventually get auth,
  since it shares the public origin.

## ADR-002: SOP rules as tested code in `care-rules.ts`
- **Date:** 2026-11-23
- **Status:** Accepted
- **Context:** The owner's SOP defines tiers, gates, deadlines and escalation.
- **Decision:** Encode every rule in `src/lib/care-rules.ts` with tests beside it; UI calls them.
- **Consequences:** One source of truth; any rule change = code + test change.

## ADR-003: Browser-local persistence (temporary)
- **Date:** 2026-11-23
- **Status:** Accepted (temporary — to be superseded)
- **Context:** Lovable Cloud could not be enabled (workspace had no credits).
- **Decision:** `src/lib/store.ts` persists to localStorage under `rama-cares-v1` with a demo seed.
- **Alternatives considered:** Lovable Cloud (Supabase) tables — blocked at the time.
- **Consequences:** No multi-user sync, no auth. Migrating to Cloud tables + console auth is the
  top open item and blocks most other work.

## ADR-004: Find-care search/map/booking rolled back
- **Date:** 2026-11-23
- **Status:** Accepted
- **Context:** A search-by-area/PIN + map + booking flow was built (`d5c78fb`, `83b31d1`).
- **Decision:** Rolled back at owner's request (`3a7957f`).
- **Consequences:** Any future version must keep the assessment gate — search OK, confirming a
  caregiver is not, until step 2 (home assessment) is done.

## ADR-005: Deterministic weekly homepage photo rotation
- **Date:** 2026-11-25
- **Status:** Accepted
- **Context:** Owner wanted a fresh hero photo weekly without a backend or scheduled job.
- **Decision:** 10-photo collection in `src/lib/home-photos.ts`; index computed from the clock
  (Monday 00:00 IST, anchored 23 Nov 2026); selection hydrated in an effect.
- **Consequences:** No storage needed; tests assert 10 distinct entries and the schedule.

## ADR-006: Enquiries by Web3Forms email + WhatsApp; cosmetic console passcode
- **Date:** 2026-11-26
- **Status:** Accepted (stopgap until Lovable Cloud — ADR-003)
- **Context:** Before go-live, enquiries only saved in the family's own browser, and the
  console was linked publicly with no login. No backend available.
- **Decision:** Public form POSTs to Web3Forms (owner's inbox; public access key in
  `src/lib/site-config.ts`) and offers a prefilled `wa.me` button. Public form no longer writes
  the local store. Console: footer link removed, `noindex`, passcode screen comparing SHA-256
  against a hash in config; unlock remembered in localStorage (`rama-console-unlock`).
- **Alternatives considered:** WhatsApp-only (family must tap Send — enquiries can be lost);
  Lovable Cloud DB + auth (blocked on credits).
- **Consequences:** Enquiry details (incl. health condition) pass through Web3Forms, a third
  party. Passcode is not security — anyone can read the hash/bypass in devtools. Replace both
  with Cloud tables + real staff auth when available.

## ADR-007: Leave Lovable — host on Vercel, own backend services
- **Date:** 2026-11-26
- **Status:** Accepted (supersedes the "Lovable Cloud" plan in ADR-003 and ADR-006)
- **Context:** Owner wants no long-term association with Lovable (no Lovable hosting, no
  Lovable Cloud). May keep editing in Lovable for a while. Owner already runs telemed-in on
  Vercel + Neon Postgres + Sentry + Twilio + WhatsApp Cloud API + Resend.
- **Decision:**
  - Phase 1 (now): deploy from GitHub to **Vercel**; keep code Lovable-compatible so the
    editor still works. Outside the Lovable sandbox `@lovable.dev/vite-tanstack-config`
    honours `NITRO_PRESET`/Vercel detection, so no build rewrite is needed yet.
  - Backend: **new, separate Neon Postgres database** for Rama Cares (not telemed-in's DB).
  - Messaging: owner chose to **reuse telemed-in's Twilio + WhatsApp + Resend accounts as-is**
    (messages carry the Telemed sender/brand until swapped).
  - Phase 2 (when owner stops using Lovable): replace the Lovable build package with plain
    TanStack Start + nitro, move homepage photos from Lovable-hosted asset pointers into the
    repo, replace `lovable-error-reporting.ts` with Sentry, remove `.lovable/`, Lovable meta
    tags and Lovable rules in `AGENTS.md`.
  - Secrets live only in Vercel env vars and a git-ignored `.env.local` — never in the repo.
- **Alternatives considered:** Lovable hosting/Cloud (rejected by owner); shared telemed-in DB
  (rejected — keeps two businesses' patient data apart); immediate Lovable cut (would break
  the Lovable editor while owner still uses it).
- **Consequences:** Phase 1 still leaves Lovable photo URLs and build package in place.
  Families may see Telemed branding on WhatsApp/SMS until Rama Cares numbers exist.

## ADR-008: Enquiries in Postgres + real staff logins (no third parties)
- **Date:** 2026-11-27
- **Status:** Accepted (supersedes ADR-006; refines ADR-007 messaging choice)
- **Context:** Owner asked to keep telemed-in and Rama Cares fully separate and to build the
  enquiry + console-gate work on the new Rama Cares Neon DB instead of Web3Forms/passcode.
- **Decision:** Public form → `submitEnquiry` server fn → `enquiries` table (zod validation on
  both sides, honeypot). Console → email + scrypt password logins in `staff_users`, httpOnly
  session cookie with SHA-256 in `staff_sessions`, lockout after 5 fails. No Twilio/Resend/
  WhatsApp API from telemed-in — nothing shared between the two businesses.
- **Alternatives considered:** Twilio OTP via telemed-in's account (rejected — separation);
  Web3Forms email (rejected — third party sees patient details).
- **Consequences:** No automatic alert when an enquiry arrives; staff check `/enquiries`.
  Add notifications later with Rama Cares' own email/WhatsApp accounts. Patients/caregivers/
  shifts/incidents still browser-local until migrated.

## ADR-009: Staff two-step sign-in — password + SMS code via Twilio Verify
- **Date:** 2026-11-27
- **Status:** Accepted
- **Context:** Owner asked for SMS codes on staff login with autofill, keeping Rama Cares
  separate from telemed-in.
- **Decision:** Twilio Verify on a **Rama Cares Twilio subaccount** (own SID/token/service).
  REST calls from `src/server/twilio.ts` (no SDK). Required for staff whose `staff_users.phone`
  is set; fails closed if Twilio isn't configured; staff without a phone stay password-only
  during rollout. Pending challenge and "trust this device 30 days" are random tokens in
  httpOnly cookies, stored as SHA-256 (`staff_login_challenges`, `staff_trusted_devices`).
  Autofill via `autocomplete="one-time-code"` + Web OTP API.
- **Alternatives considered:** OTP-only login (weaker: phone alone = access); WhatsApp channel
  (later, as fallback); storing our own codes + sending SMS (needs India DLT registration —
  Verify handles it).
- **Consequences:** Each SMS costs Twilio Verify per-verification fees. Android Chrome full
  auto-fill needs the SMS to end with `@<domain> #<code>`, which requires a custom Verify
  template once the domain is live; keyboard suggestion works without it.

## ADR-010: Console data in Postgres; SOP rules enforced server-side
- **Date:** 2026-11-27
- **Status:** Accepted (supersedes ADR-003)
- **Context:** Patients, caregivers, logs, incidents and complaints lived in each browser, so
  staff couldn't share data and a family portal was impossible.
- **Decision:** Migration 003 adds those tables (with `created_by`-style audit columns).
  `src/lib/api/console.ts` exposes one server fn per action; each requires a staff session and
  re-runs SOP checks via shared functions in `care-rules.ts` (`advanceBlockReason`,
  `assignmentBlockReason`). DB check constraint enforces the assignment gate. Tier changes drop
  newly-unqualified caregivers. Client `store.ts` is a cache loaded after sign-in; `run()` shows
  server refusals. Demo seed removed — console starts empty.
- **Alternatives considered:** React Query per page (more moving parts for small data); trust
  UI-only checks (bypassable).
- **Consequences:** One fetch loads all console data (fine at current scale; paginate later).
  Old localStorage demo data is ignored.
