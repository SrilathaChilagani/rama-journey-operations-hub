# Active Context

> What is being worked on RIGHT NOW. Volatile — overwrite freely.
> Session-state file for Claude Code.

## Current Focus
- **2026-11-27:** Leaving Lovable (ADR-007) + DB-backed enquiries and staff logins (ADR-008)
  are built and tested locally. Pushed (`ca03234`) and live-verified on Vercel; `DATABASE_URL` re-set clean.
  telemed-in fully separate (nothing of Rama's was in it).
- Owner admin login created (password = `ADMIN_PORTAL_DEFAULT_PASSWORD` in `.env.local`).
- SMS sign-in code built (ADR-009). Twilio keys in `.env.local` + Vercel (subaccount renamed
  "Rama Cares", Trial; Verify service created). Owner's live SMS sign-in works (confirmed 2026-11-27).
- **Next:** move console data (patients etc.) to Neon; enquiry alerts with Rama-own accounts;
  connect Hostinger domain to Vercel; Phase 2 Lovable removal when owner is ready.

## Assumptions
- Claude Code is the only agent writing this memory bank (Lovable edits arrive as commits;
  reconcile them into `progress.md` at the start of a session by checking `git log`).

## Next Action
- On the next request: read all memory-bank files, check `git log` for Lovable commits not yet
  logged, add the request to the Change Request Log, do the work, update these files.
