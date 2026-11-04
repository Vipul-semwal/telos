# Initial Modules Specification & Boundaries

## 1. Disciplines (`src/modules/disciplines`)
- **Domain Entity:** `disciplines` table.
- **Rule:** Maximum 3 active disciplines per user.
- **Statuses:** `active`, `archived`.

## 2. Projects (`src/modules/projects`)
- **Domain Entity:** `projects` table (`id`, `user_id`, `discipline_id`, `title`, `description`, `desired_outcome`, `status`, `created_at`, `updated_at`).
- **Capacity Constraint:** Maximum 3 **active** projects per Discipline. The 4th active project is rejected with `CapacityExceededError`.
- **Status Lifecycle:**
  - `active`: Consumes 1 slot of the 3-active project limit.
  - `paused`: Temporary hold, frees active slot without altering child tasks.
  - `completed`: Successfully delivered, frees active slot, preserves full task & session history.
  - `archived`: Decommissioned / vaulted, frees active slot, preserves all records and tasks.
- **Restoration Rules:** Restoring an archived project checks capacity; if 3 active projects already exist, user is prompted to restore as paused or make an existing project inactive first.
- **Project Structure & Sections:**
  - Overview (summary, outcome, discipline context, progress)
  - Tasks (relationship foundation to child tasks)
  - Warehouse (future placeholder)
  - Resolution Engine (future placeholder)
  - Reports (future placeholder)
  - Knowledge (future placeholder)
  - Decisions (future placeholder)

## 3. Tasks & Subtasks (`src/modules/tasks`)
- **Domain Entity:** `tasks` table with self-referencing `parentTaskId`.
- **Rule:** Hierarchy is strictly Discipline ? Project ? Task ? Subtask. No nested subtasks (`parentTask.parentTaskId === null`).
- **Statuses:** `todo`, `in_progress`, `completed`, `cancelled`.
- **History:** `task_history` table records state transitions and working events.

## 4. Brain Dump (`src/modules/brain-dump`)
- **Domain Entity:** `brain_dump_items` table.
- **Rule:** Capture raw thought without classification; triage converts to project, task, or subtask.

## 5. Daily Planning (`src/modules/daily-planning`)
- **Domain Entity:** `daily_plans` and `daily_plan_items`.
- **Rule:** Maximum 4 hours (14,400 seconds) planned allocation per day.
- **Statuses:** `planned`, `in_progress`, `completed`, `deferred`.

## 6. Time Tracking (`src/modules/time-tracking`)
- **Domain Entity:** `time_sessions` table.
- **Rule:** Exactly one active timer per user. Stop pauses recording without completing task.
- **ETA Status:** Green ($\le$ estimate) or Red ($>$ estimate).

## 7. Reporting (`src/modules/reporting`)
- **Rule:** Derived entirely on-demand from underlying task sessions. No duplicated static totals.

## 8. Cockpit (`src/modules/cockpit`)
- **Rule:** Aggregates operational telemetry (disciplines count, daily planned time, running timer, inbox count).
