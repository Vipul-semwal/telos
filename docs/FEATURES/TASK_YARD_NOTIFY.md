# Task Yard and Notify

## Task Yard

Task Yard is an optional workspace attached to a task. It provides:

- A manually authored TL;DR.
- Sanitized rich-text notes with explicit saving and unsaved-change protection.
- Permanent flashcard, reminder, and custom recall cards.
- In-yard flashcard study and review history.
- Scheduling to Cockpit through the shared notification engine.

A task may exist without a Task Yard. Opening the Task Yard creates the optional
workspace; no task templates or mandatory card fields are introduced.

## Notify

Notify is a standalone sidebar module for persistent notifications. It supports:

- Standalone or task/project/discipline-associated notifications.
- Upcoming, due, completed, and historical views.
- One-time and recurring schedules.
- Edit/reschedule, snooze, pause/resume, complete, dismiss, end recurrence, and delete.
- A visible destination of Cockpit only.

## Shared Scheduling Model

| Entity | Responsibility |
| :--- | :--- |
| Source object | Permanent notification or recall card |
| Schedule | Recurrence rule, timezone, next run, limits, pause/end state |
| Occurrence | One scheduled appearance with its own lifecycle |
| Delivery | Cockpit delivery and read state |
| Review/history | Source-level review and audit events |

Important invariants:

- A permanent card/notification is never duplicated to become due.
- A unique `(schedule_id, scheduled_for)` constraint prevents duplicate occurrences.
- Read status does not resolve a reminder or complete a card.
- Source completion, occurrence resolution, delivery, and read status remain distinct.
- Schedules use UTC instants and IANA timezone identifiers.
- Monthly dates are clamped to the final valid day of shorter months.
- Lazy page materialization and `pnpm notifications:process` share the same idempotent scheduler.

## Recurrence

Supported structured rules:

- Once.
- Daily.
- Selected weekdays.
- Weekly with week interval.
- Monthly with interval and day-of-month clamping.
- Custom minute/hour/day interval.

Optional end date and maximum occurrence limits are available behind progressive
disclosure.

## APIs

Task Yard:

- `GET/PATCH /api/tasks/[id]/yard`
- `POST /api/tasks/[id]/yard/notes`
- `PATCH/DELETE /api/tasks/[id]/yard/notes/[noteId]`
- `POST /api/tasks/[id]/yard/cards`
- `PATCH/DELETE /api/tasks/[id]/yard/cards/[cardId]`
- `POST /api/tasks/[id]/yard/cards/[cardId]/review`
- `POST /api/tasks/[id]/yard/cards/[cardId]/schedule`

Notify and occurrence actions:

- `GET/POST /api/notifications`
- `PATCH/DELETE /api/notifications/[id]`
- `POST /api/notifications/[id]/actions`
- `PATCH /api/notification-occurrences/[id]`

## Operational Processing

Pages call deterministic materialization lazily so restarts recover naturally.
Deployments may additionally run:

```bash
pnpm notifications:process
```

The worker is idempotent. A future cron/scheduler can invoke the same command or
service without changing source modules.
