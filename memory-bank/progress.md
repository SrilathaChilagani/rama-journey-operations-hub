# Progress

> Source of truth for project status and the log of every change the user requests.
> Update at the end of every session. Newest dated section at the bottom of "Done".

Last updated: 2026-11-27 — Claude Code (enquiries + staff logins on Neon; telemed separation)

## ✅ Done / Working
### 2026-11-23
- Operations console built from the SOP: patient journey, caregivers, daily care log,
  incidents & complaints (`73dd4a4`).
- Patient-facing website with assessment request form; console moved to `/console` (`ce3a7de`).
- Find-care search/map/booking added (`d5c78fb`, `83b31d1`) then **rolled back** (`3a7957f`).
- Detail page for each of the four services (`da13ef2`).

### 2026-11-25
- Homepage modernised with fresh photography and sleek patient-facing design (`9ee5411`).
- Ten homepage care photos with automatic weekly rotation (`5e3d60f`).

### 2026-11-26
- Build tooling lockfile updated to vite-tanstack-config 2.28.0 (`cb4d789`).
- Project README written for Claude and other agents (`136362a`, `be54bfe`).
- Back button and website link added to staff console pages — `AppShell.tsx` (`4609c5a`).
- Memory bank (`memory-bank/`) + `CLAUDE.md` protocol set up (Claude Code) (`902cdb6`).
- Public enquiry form now emails the owner via Web3Forms (no longer writes the family's own
  localStorage); WhatsApp button prefilled with the enquiry on thank-you and error states.
- Staff console: footer link removed, `noindex` on console pages, cosmetic passcode screen in
  `AppShell` with "Lock console" link. Settings in `src/lib/site-config.ts`. 5 new tests.

### 2026-11-27
- Vercel project `rama-journey-operations-hub` linked (GitHub connected, env `DATABASE_URL`
  = new Neon DB `ep-calm-darkness…`, `NITRO_PRESET=vercel`). First production deploy of `main`
  READY at https://rama-journey-operations-hub.vercel.app (/, /console, /services/* = 200).
- Homepage photos downloaded from Lovable storage (sizes verified) into `src/assets/*.jpg`;
  asset pointers removed (`e6da88e`).
- telemed-in audited: no Rama Cares code, tables or schema — nothing to remove. Rama
  `.env.local` trimmed from a full telemed-in copy to Rama-only keys (59 identical telemed values
  removed; comment that broke `DATABASE_URL` removed). Vercel `DATABASE_URL` re-set clean
  (production + preview).
- Enquiries saved to Neon `enquiries` table; new console page `/enquiries`; Web3Forms removed.
- Real staff sign-in (email + scrypt password, httpOnly session, lockout) replaces the passcode;
  `staff-gate.ts` deleted. `db/migrations/001_…sql` applied to Rama DB. Scripts `db:migrate`,
  `staff:create`. 14 tests pass; browser end-to-end test passed (form → DB → sign-in → list →
  status → sign-out; server refuses data without session). Test data deleted.
- Pushed `e6da88e` + `ca03234`; Vercel auto-deployed. Live check: form saved a row in Neon
  (deleted after), live sign-in queries the DB, photos load.

## 🐞 Known Issues / Limitations
- No alert when an enquiry arrives (staff must check `/enquiries`).
- WhatsApp number in `site-config.ts` empty → WhatsApp button hidden.
- No rate limit on the public form beyond the honeypot.
- Existing Lovable code doesn't pass `prettier/prettier` lint (pre-existing).
- Console patients/caregivers/shifts/incidents still per-browser localStorage.
- Owner's shell profile sets a stale `VERCEL_TOKEN` that overrides `vercel login`; run the CLI
  as `env -u VERCEL_TOKEN vercel …` (or remove it from the profile).

## 📋 Next Up (open items from README)
1. **Console data → Neon** — patients, caregivers, shifts, incidents, complaints behind `requireStaff()`.
1b. **Enquiry alerts** — with Rama Cares' own email/WhatsApp (not telemed-in's).
2. **Caregiver search + booking** — only if owner asks again; must respect assessment gate.
3. **Prices and pay** — still `[TO SET]`.
4. **Contact details** — phone/email/address not final.
5. **Domain** — booked, not yet connected.

## 📝 Change Request Log
> Every change the user asks for, in order. Status: Requested | In progress | Done | Rolled back | Dropped.

| Date | Request | Status | Commit / files |
| --- | --- | --- | --- |
| 2026-11-23 | Find-care search by area/PIN with map and booking | Rolled back | `83b31d1` → `3a7957f` |
| 2026-11-26 | Back button + website link on console pages | Done | `4609c5a` |
| 2026-11-26 | Set up memory bank like telemed-in to record all requested changes | Done | `902cdb6` |
| 2026-11-26 | Publish website on Hostinger domain (steps given; user to do DNS + Lovable connect) | Dropped — replaced by Vercel hosting (ADR-007) | — |
| 2026-11-26 | Make enquiries reach staff: email via Web3Forms + WhatsApp button | Superseded by DB version (2026-11-27) | `src/lib/enquiry.ts`, `src/routes/index.tsx` |
| 2026-11-26 | Hide staff console: remove footer link, noindex, passcode screen | Superseded by real staff logins (2026-11-27) | `AppShell.tsx` |
| 2026-11-26 | Leave Lovable entirely: host on Vercel (not Lovable), own Postgres/Sentry/etc., no Lovable association long-term | In progress — decisions made (ADR-007); Vercel live; photos fixed (`e6da88e`); next: push, DB schema, staff auth | ADR-007, `e6da88e` |
| 2026-11-27 | Log in to Vercel, link project, find why production deployment missing | Done — deployed clean `main`; photos fixed | `e6da88e` |
| 2026-11-27 | Remove Rama Cares references from telemed-in; keep the two fully separate | Done — none existed in telemed-in; Rama `.env.local` trimmed of telemed values | `.env.local` (local only) |
| 2026-11-27 | Rebuild enquiries + console protection on the new Neon DB (no Web3Forms/passcode) | Done — pushed `ca03234`, live-verified on Vercel | ADR-008, `db/`, `src/server/`, `src/lib/api/` |
| 2026-11-27 | Create owner's console login using the password in `.env.local` | Done — admin login created, verified on live site | DB only |
