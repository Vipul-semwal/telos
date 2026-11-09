# ADR 0007: Unified Recall and Notification Engine

## Status
Accepted

## Context
Task Yard recall cards and standalone Notify records have different source
lifecycles but identical scheduling needs. Implementing separate schedulers
would duplicate recurrence logic and risk divergent delivery behavior.

## Decision
Create one notification module that owns:

- Structured schedules.
- Idempotent occurrence generation.
- Delivery adapter contracts.
- Read/delivery state.
- Snooze, pause, resume, completion, and history.

Task Yard stores permanent cards and review records, while Notify stores
standalone persistent notifications. Both schedule through the shared service.
Cockpit is the only registered destination adapter.

Recurrence is represented as a validated rule, evaluated with Temporal and IANA
timezones. Occurrence uniqueness is enforced by a database index.

## Consequences
- Flashcard identity remains stable across repeated appearances.
- Notification read state cannot silently complete a source.
- Future email, messaging, or browser destinations can implement the destination
  interface without changing source or scheduling code.
- Task Yard and Notify remain independent at the domain-source layer.
