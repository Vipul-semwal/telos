# ADR 0006: Connected Next-Action Flow

## Status
Accepted

## Context
The first complete product audit found that Telos recorded work well once data
already existed, but a new operator could not create the first discipline. The
Cockpit also displayed telemetry and architecture information without helping
the operator choose a next action. Other disconnected points included project
report placeholders, current-session-only timer ETA, and backend-only task
ordering.

## Decision
Complete the deterministic connections between existing modules:

- Disciplines have full create, edit, archive, restore, and active-capacity UI
  and API workflows.
- The Cockpit derives one next action from current state. The recommendation may
  open an active timer, today’s plan, an open or overdue task, inbox triage, or
  the next required setup step.
- Time Tracking evaluates ETA from cumulative task duration plus the active
  interval. This matches the definition used by Reporting.
- Project Reports expose derived estimate variance and session data instead of a
  future placeholder.
- Root tasks support keyboard-accessible move-up and move-down ordering.
- Deferred project modules are hidden from the MVP tab bar until they have real
  user workflows.

The next-action logic is deterministic and uses only local domain data. It does
not introduce an AI SDK or provider dependency.

## Consequences
- A clean account can now complete the full journey from first discipline to
  measured execution.
- The Cockpit becomes an operational decision surface rather than a static
  dashboard.
- Timer and report ETA states use the same aggregate duration definition.
- Defensible product depth remains future work, but no primary business-flow
  connection depends on a placeholder screen.
