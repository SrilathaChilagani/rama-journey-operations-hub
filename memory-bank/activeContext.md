# Active Context

> What is being worked on RIGHT NOW. Volatile — overwrite freely.
> Session-state file for Claude Code.

## Current Focus
- **2026-11-28:** Launch hardening done: `/privacy`, Sentry reporter (ADR-013), `/staff` logins
  page, enquiry spam limits (migration 006 applied). Pushed to `main` → Vercel.
- Waiting on owner (`.env.local` placeholders, then copy to Vercel production + preview):
  - `VITE_SENTRY_DSN` — new "Rama Cares" Sentry project (keep separate from telemed-in).
  - Notifications: `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`, `STAFF_ALERT_EMAILS`,
    `TWILIO_WHATSAPP_FROM`, `STAFF_ALERT_WHATSAPP`, `APP_BASE_URL`.
  - Privacy contacts + legal name in `src/lib/site-config.ts`.
- Owner is deciding on a Rama Cares WhatsApp sender (separate Meta business portfolio, via Twilio
  self sign-up in the Rama Cares subaccount; needs Twilio upgrade + a number not on WhatsApp).

## Assumptions
- Claude Code is the only agent writing this memory bank (Lovable edits arrive as commits;
  reconcile them into `progress.md` at the start of a session by checking `git log`).
- Owner prefers no yes/no confirmations — proceed and finish.

## Next Action
- When owner fills values: copy to Vercel (`env -u VERCEL_TOKEN vercel env add …`), redeploy,
  live-test WhatsApp/email and a Sentry test event.
- Later: domain → Vercel; Phase 2 Lovable removal (then consider official Sentry SDK).
