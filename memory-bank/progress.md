# Progress

> Source of truth for project status and the log of every change the user requests.
> Update at the end of every session. Newest dated section at the bottom of "Done".

Last updated: 2026-11-26 — Claude Code (memory bank created)

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
- Memory bank (`memory-bank/`) + `CLAUDE.md` protocol set up (Claude Code).

## 🐞 Known Issues / Limitations
- No auth: anyone with the URL can open and edit the console (demo data, own browser only).
- Data is per-browser localStorage — no sync between devices or users.
- Homepage photos are Lovable-hosted asset pointers — broken in a plain local clone.

## 📋 Next Up (open items from README)
1. **Backend** — move `store.ts` to Lovable Cloud tables + console auth (blocks the rest).
2. **Caregiver search + booking** — only if owner asks again; must respect assessment gate.
3. **Prices and pay** — still `[TO SET]`.
4. **Contact details** — phone/email/address not final.
5. **Domain** — booked, not yet connected.
6. **Photos** — swap to repo-local files if hosted outside Lovable.

## 📝 Change Request Log
> Every change the user asks for, in order. Status: Requested | In progress | Done | Rolled back | Dropped.

| Date | Request | Status | Commit / files |
| --- | --- | --- | --- |
| 2026-11-23 | Find-care search by area/PIN with map and booking | Rolled back | `83b31d1` → `3a7957f` |
| 2026-11-26 | Back button + website link on console pages | Done | `4609c5a` |
| 2026-11-26 | Set up memory bank like telemed-in to record all requested changes | Done | `memory-bank/`, `CLAUDE.md` |
