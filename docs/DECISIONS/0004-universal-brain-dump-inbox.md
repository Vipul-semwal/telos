# ADR 0004: Universal Brain Dump Inbox Independent of the Pursuit Hierarchy

## Status
Accepted

## Context
The core product hierarchy is strictly `Discipline → Project → Task → Subtask`.
Forcing every captured thought into that hierarchy at capture time adds friction
and encourages the operator to skip capture entirely. Brain Dump must accept any
kind of input — ideas, tasks, questions, references, research topics, problems —
before its destination is known.

## Decision
Implement Brain Dump as a standalone module with its own `brain_dump_items`
table, lifecycle, and service boundary. It does not require a Discipline or
Project at capture time.

- The only required field is `content`.
- `kind` is an optional, user-assigned hint.
- Lifecycle states are `inbox`, `converted`, `archived`, and `dismissed`.
- Records are never hard-deleted; archive/dismiss/restore preserve history.
- Manual triage can convert to a Task (a valid owned Project is mandatory),
  create a Project from a Discipline, link to an existing Project/Discipline,
  or keep the item as a note.
- Conversion records `convertedToType`, `convertedToId`, and `convertedAt` while
  leaving the original content intact.
- AI classification is explicitly out of scope for this implementation and no AI
  SDK is imported by the module.

## Consequences
- **Positive:** Capture is fast and unbiased. The inbox remains a reviewable,
  auditable record. The module can later connect to a Resolution Engine, AI
  classifiers, duplicate detection, or review workflows without changing the
  pursuit hierarchy.
- **Negative:** Items can remain unclassified indefinitely, so the operator must
  periodically review the inbox. Cross-module conversion must go through the
  public `TasksService` / `ProjectsService` interfaces rather than direct table
  writes.
