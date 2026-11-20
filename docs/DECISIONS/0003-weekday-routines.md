# 0003: Weekday Routine Occurrences

## Context

Recurring commitments such as exercise are not one-off tasks. A routine may use a different activity on each selected weekday, while time tracking must remain task-level and Today's Plan must stay idempotent.

## Decision

- A routine belongs to one project and contains one variant per selected weekday.
- Each variant owns a persistent task with `kind = routine` and its own ETA.
- The dashboard shell materializes today's matching variant into Today's Plan.
- A unique `(routine_id, local_date)` occurrence prevents duplicate daily insertion.
- Daily plan items record `source_type = routine` and link to the occurrence.
- Completing, deferring, or removing the plan item updates the occurrence lifecycle.
- Routine tasks cannot be manually planned; their schedule controls when they appear.
- Time sessions link to the routine occurrence when tracking a recurring commitment.

## Consequences

The same permanent exercise task accumulates history across days. Project completion metrics exclude routine tasks because their leadership metric is occurrence adherence rather than one-time completion.
