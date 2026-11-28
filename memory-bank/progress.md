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

- **Live SMS sign-in confirmed by owner on phone (autofill + trust device).**
- Staff SMS sign-in code (ADR-009): migration 002 applied; two-step UI with autofill,
  resend timer, trust-device; `staff:phone` script. 19 tests pass; browser e2e against a fake
  Twilio passed (masked phone, no session before code, wrong code rejected, auto-submit,
  trusted device skips code, untrusted device asked). Test data deleted.

- **Phase 1 (ADR-010):** console data in Neon (migration 003), server-side SOP checks, DB
  assignment-gate constraint, enquiry → patient button, demo data removed. 21 tests pass.
  Browser e2e (11 steps) passed: enquiry→patient, caregivers, journey gates, server refused an
  injected unqualified caregiver, tier change dropped unqualified backup, logs, incidents,
  complaints, second device sees same data, audit column set. Test data deleted.

- **Phase 2 (ADR-011):** family portal `/family` + staff "Family portal access" panel; migration
  004; `normalizePhone` (+3 tests, 24 total). E2E vs fake Twilio passed: unregistered number gets
  same screen + no SMS; consent stored; portal content; staff notes + other patients hidden;
  forged cross-family request refused; concern → staff "from family" → ack shown to family;
  removing access ends session; phone normalised; hourly limit. Desktop + mobile screenshots
  checked. Test data deleted.

## 🐞 Known Issues / Limitations
- Twilio subaccount (renamed Ourspace → "Rama Cares") is a **Trial**: SMS only to numbers verified in
  that subaccount (none yet). Upgrade before staff go live. Owner's number verified (trial) and on file → owner now needs SMS code.
- Twilio trial: family portal codes only reach numbers verified in the Rama Cares subaccount.
- No alert when an enquiry or family concern arrives (staff must check `/enquiries`).
- WhatsApp number in `site-config.ts` empty → WhatsApp button hidden.
- No rate limit on the public form beyond the honeypot.
- Existing Lovable code doesn't pass `prettier/prettier` lint (pre-existing).
- Complaint/status checkboxes update after the server confirms (~0.5 s), not instantly.
- All console data loads in one request — fine now, paginate when records grow.
- Owner's shell profile sets a stale `VERCEL_TOKEN` that overrides `vercel login`; run the CLI
  as `env -u VERCEL_TOKEN vercel …` (or remove it from the profile).

## 📋 Next Up (open items from README)
1. **Notifications** — staff alerts (enquiries, family concerns); daily report SMS/WhatsApp to families.
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
| 2026-11-27 | Staff login: password + SMS code (Twilio Verify, Rama Cares subaccount) with code autofill | Done — live SMS sign-in confirmed by owner (2026-11-27) | ADR-009, `db/migrations/002…`, `src/server/twilio.ts` |
| 2026-11-27 | Add Twilio variable placeholders to `.env.local`; always add placeholders for new keys | Done — owner fills values | `.env.local` (local only) |
| 2026-11-27 | Use the Twilio keys added to `.env.local`; rename Ourspace subaccount to Rama Cares | Done — Verify service created, keys in Vercel; owner number verified + attached; **live SMS sign-in confirmed working by owner** | Twilio + Vercel env |
| 2026-11-27 | Phase 1: move console data (patients, caregivers, care logs, incidents, complaints) from browser storage to the Neon DB | Done | ADR-010, `db/migrations/003…`, `src/lib/api/console.ts` |
| 2026-11-27 | Phase 2: family portal at /family — guardian phone + SMS code, daily reports, care plan, nurse visits, raise a concern; homepage styling | Done | ADR-011, `db/migrations/004…`, `src/routes/family.tsx` |
