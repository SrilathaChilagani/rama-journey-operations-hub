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
