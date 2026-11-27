# Product Context

> Core purpose, domain, audiences and business rules. Stable — edit deliberately.
> Source: `README.md`, owner's SOP document ("Rama Cares — Business Structure & Standard
> Operating Procedures"), `src/lib/care-rules.ts`, `src/lib/services.ts`.

## Product Vision
- **Product name:** Rama Cares (repo: `rama-journey-operations-hub`).
- **What it is:** Nurse-led home care in Hyderabad. One app, two audiences:
  - **Patient/family website** (`/`, `/services/$slug`) — services, care promise, tiers,
    how it works, assessment request form.
  - **Staff operations console** (`/console`, `/patients`, `/caregivers`, `/shifts`,
    `/incidents`) — runs the SOP workflow end to end.
- A family enquiry from the public site appears immediately in the console (same store).
- Built and edited in **Lovable**; changes there commit to this repo and vice versa.

## Non-negotiables
- The SOP is code, not prose: business rules live in `src/lib/care-rules.ts` only.
- **Assessment gate:** no caregiver is assigned before journey step ≥ 3 and a nurse-set tier.
- **Never invent prices, pay or headcounts** — they are `[TO SET]` by the owner. Public copy
  says "quoted in writing after assessment".
- Staff console styling must not be disturbed by homepage changes (`.patient-home` scope).

## Services (`src/lib/services.ts`)
`after-hospital-stay`, `elderly-care`, `rehabilitation`, `equipment-and-supplies`.
Unknown slug → `notFound()`.

## SOP rules (all in `src/lib/care-rules.ts`)
| Rule | Detail |
| --- | --- |
| Tiers T1–T4 | T1 Companion / Care Companion / monthly · T2 Personal care / Certified Caregiver / fortnightly · T3 Skilled support / Senior Caregiver or nurse / weekly · T4 Nursing / Registered Nurse / nurse lead + doctor on call |
| Cadre qualification | `CADRE_TIERS`, `cadreQualifies` — Care Companion can't do T3/T4; RN covers all |
| Assignment gate | `canAssignCaregiver` — step ≥ 3 **and** tier set |
| Nurse visits | `nextNurseVisitDue` — first within 48 h of care start, then 30 / 14 / 7 / 7 days |
| Complaints | `complaintDeadlines` — acknowledge ≤ 2 h, resolve/plan ≤ 48 h |
| Escalation | `SEVERITY` — Red: 108 → family → Care Manager, stay, guardian update every 30 min · Amber: Care Manager within 15 min · Green: log + daily report |
| Journey (8 steps) | Enquiry → Home assessment → Care plan & quote → Match & introduce → Care starts → 48-hour review → Ongoing care → Closure |

## Roles
- Families / patients (public site, no login).
- Staff: Care Manager, nurses, caregivers by cadre (Care Companion, Certified Caregiver,
  Senior Caregiver, Registered Nurse). **No auth yet** — console is open to anyone with the URL.

## Owner decisions on record
- Find-care search/map/booking flow was **rolled back at the owner's request** (2026-11-23,
  `3a7957f`). Any future version must still respect the assessment gate.
- A domain is booked; to be connected later.
