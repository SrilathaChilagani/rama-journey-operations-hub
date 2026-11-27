# System Patterns

> Stack, conventions, data model. Stable — edit deliberately.
> Source: `README.md`, `package.json`, `AGENTS.md`, `src/`.

## Technology Stack
- **Framework:** TanStack Start v1 (React 19, Vite 8), file-based routing in `src/routes/`.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`); theme tokens in `src/styles.css`.
- **Components:** shadcn/ui in `src/components/ui/`; app shell in `src/components/rc/AppShell.tsx`.
- **Data:** browser-local store `src/lib/store.ts` (localStorage key `rama-cares-v1`).
- **Tests:** Vitest + Testing Library (jsdom), setup `src/test/setup.ts`.
- **Fonts:** Fraunces (display), Inter (sans), Manrope (patient home) — in `src/routes/__root.tsx`.
- **Package manager:** bun (`bun.lock`) or npm.
- **Hosting/editor:** Lovable (project `11af10fd-04f2-4aa1-948b-ec650a369e19`).

## Commands
`npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run format` ·
typecheck `npx tsc --noEmit`.

## Routes
| Route | File |
| --- | --- |
| `/` | `src/routes/index.tsx` |
| `/services/$slug` | `src/routes/services.$slug.tsx` |
| `/console` | `src/routes/console.tsx` |
| `/patients` | `src/routes/patients.tsx` |
| `/caregivers` | `src/routes/caregivers.tsx` |
| `/shifts` | `src/routes/shifts.tsx` |
| `/incidents` | `src/routes/incidents.tsx` |

## Data model (`src/lib/store.ts`)
- Types: `Patient`, `Caregiver`, `ShiftLog`, `Incident`, `Complaint`, `State`.
- Seed: 4 caregivers, 3 patients, 1 shift log, 1 Amber incident.
- API: `useStore()` (`useSyncExternalStore`), `update(fn)` immutable write, `resetDemo()`,
  `uid()`, `fmt()`.
- New enquiry (public form or console) = `Patient` with `journeyStep: 1`, `tier: null`, no caregiver.
- Per-browser only: no sync across devices/users; clearing storage resets to seed.

## Key Conventions
- SOP logic only in `src/lib/care-rules.ts`; update `care-rules.test.ts` with any rule change.
  Pages call these functions, never re-state them.
- Patient-home CSS stays inside the `.patient-home` wrapper in `src/styles.css`.
- `src/routeTree.gen.ts` is generated — never hand-edit; creating a route file is enough.
- Each content route sets its own `head()`; no `og:image`/`twitter:image` in `__root.tsx`.
- Homepage photos: `src/lib/home-photos.ts` (10 photos, weekly rotation Monday 00:00 IST,
  anchored Mon 23 Nov 2026, computed from clock, hydrated in an effect to avoid SSR mismatch).
  Photos are Lovable asset pointers (`src/assets/*.asset.json`) — broken in a plain local clone.

## Lovable guardrails (from `AGENTS.md`)
- Never rewrite pushed history (no force push / amend / rebase of pushed commits).
- Keep the connected branch (`main`) working — pushes sync to the Lovable editor.
- Don't edit generated files, `supabase/migrations/`, or `drizzle/`; schema changes go via Lovable.
- No secrets in the repo; AI calls via Lovable gateway, `LOVABLE_API_KEY` never in browser code.

## Security posture (current)
- No auth, no backend, no server-side data. Console is public and demo-only.
- Never store real patient data (names, phones, health info) in seed data or the memory bank.
