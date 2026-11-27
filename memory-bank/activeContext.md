# Active Context

> What is being worked on RIGHT NOW. Volatile — overwrite freely.
> Session-state file for Claude Code.

## Current Focus
- **Last task (2026-11-26):** Created the memory bank (`memory-bank/`) and `CLAUDE.md`
  protocol, modelled on the telemed-in project. No application code changed.
- **Next task:** Waiting for the user's next change request.

## Files touched this task
- `CLAUDE.md` (new), `memory-bank/*.md` (new).

## Assumptions
- Claude Code is the only agent writing this memory bank (Lovable edits arrive as commits;
  reconcile them into `progress.md` at the start of a session by checking `git log`).

## Next Action
- On the next request: read all memory-bank files, check `git log` for Lovable commits not yet
  logged, add the request to the Change Request Log, do the work, update these files.
