# Project Instructions

@AGENTS.md

## Memory Bank Protocol (MANDATORY)

This project uses **`memory-bank/`** as persistent memory across sessions. Treat it as the
source of truth alongside `README.md`. Follow this protocol on **every** task.

### At the START of every task
1. Read ALL files in `memory-bank/` before planning or writing code:
   - `productContext.md` — purpose, audiences, SOP business rules, owner decisions
   - `systemPatterns.md` — stack, routes, data model, conventions, Lovable guardrails
   - `architecturalDecisions.md` — ADR log
   - `activeContext.md` — what's being worked on right now
   - `progress.md` — what's done, known issues, next up, and the **Change Request Log**
2. Run `git log --oneline -15`. Commits made in Lovable (author `gpt-engineer-app[bot]`) that
   aren't in `progress.md` yet must be added there first.
3. Don't contradict recorded decisions without proposing a new ADR.

### For EVERY change the user requests
- Add a row to the **Change Request Log** in `progress.md` (date, request in plain words,
  status, commit/files). Update the status as it moves: Requested → In progress → Done /
  Rolled back / Dropped. Keep rows even for rolled-back or dropped requests.

### At the END of every task
1. `activeContext.md` — set Current Focus / Next Action; clear stale notes.
2. `progress.md` — move finished items to ✅ Done under today's date, record new 🐞 issues,
   reorder 📋 Next Up, update the `Last updated` line (date + `Claude Code`).
3. Significant tech choice → append an ADR to `architecturalDecisions.md` (supersede, don't rewrite).
4. Product/SOP rules changed → `productContext.md`. Stack/conventions changed → `systemPatterns.md`.

### Rules
- `activeContext.md` is volatile; the other four are stable — edit deliberately.
- Never store secrets, API keys, or real patient data in the memory bank.
- Never invent prices, pay or headcounts — they are `[TO SET]` by the owner.
