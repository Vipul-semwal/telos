# Database Architecture & Schema Design

## 1. Relational Conventions

- **Primary Keys:** UUID v4 (`defaultRandom()` in Drizzle, `gen_random_uuid()` in PostgreSQL).
- **Timestamps:** Timezone-aware UTC timestamps (`timestamp with timezone`, `defaultNow()`).
- **Durations:** Integer seconds (`integer`), never floating-point hours or milliseconds.
- **Cascading Constraints:** Deleting a user cascades deletion across all owned entities.
- **Migration Strategy:** Versioned SQL migrations managed via `drizzle-kit generate` and `drizzle-kit migrate`. Destructive schema synchronization (`db push`) is forbidden in production.

## 2. Table Specifications

| Table | Module | Primary Purpose | Key Indexes |
| :--- | :--- | :--- | :--- |
| `user` | auth | Identity, username, internal email | `username (unique)`, `email (unique)` |
| `session` | auth | Active server sessions | `token (unique)`, `userId` |
| `account` | auth | Credentials & password hashes | `userId` |
| `verification` | auth | Token verification | `identifier` |
| `disciplines` | disciplines | Areas of sustained pursuit | `(userId, status)` |
| `projects` | projects | Initiatives under disciplines | `(userId, disciplineId, status)` |
| `tasks` | tasks | Actionable items & subtasks | `(userId, projectId, status)`, `parentTaskId` |
| `task_history` | tasks | Append-only execution history | `(taskId, createdAt)`, `userId` |
| `brain_dump_items` | brain-dump | Raw captured thoughts | `(userId, status)` |
| `daily_plans` | daily-planning | Day allocation records | `(userId, planDate) [unique]` |
| `daily_plan_items` | daily-planning | Tasks assigned to today | `(dailyPlanId, taskId) [unique]` |
| `time_sessions` | time-tracking | Discrete stopwatch logs | `(userId, taskId)`, `(userId, endTime)` |
