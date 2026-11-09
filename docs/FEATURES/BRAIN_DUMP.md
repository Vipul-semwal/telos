# Brain Dump — Universal Capture Inbox

## Purpose

Brain Dump is a **universal, frictionless capture inbox**. It is deliberately
independent of the `Discipline → Project → Task → Subtask` pursuit hierarchy.

The operator should be able to get anything out of their head in seconds — an
idea, task, question, reminder, research topic, problem, reference, or a possible
future project — **without deciding where it belongs**. Classification happens
later, manually.

## Domain Model

Table: `brain_dump_items`

| Column | Purpose |
| :--- | :--- |
| `id`, `user_id` | Identity and strict tenant ownership |
| `content` | The captured thought (only required field) |
| `kind` | Optional self-assigned hint (`note`, `idea`, `task`, `question`, `reference`, `project_idea`, `research`, `problem`, `info`) |
| `status` | Lifecycle state: `inbox`, `converted`, `archived`, `dismissed` |
| `discipline_id`, `project_id` | Optional associations created during manual triage |
| `converted_to_type`, `converted_to_id` | Exact record of what the item was resolved into |
| `converted_at`, `archived_at`, `dismissed_at` | Lifecycle timestamps |
| `created_at`, `updated_at` | Capture and edit timestamps |

**Nothing is hard-deleted.** Archive and dismiss preserve the original content,
timestamps, and conversion history so the record remains traceable.

## Lifecycle

```text
                    ┌──────────── archive ────────────┐
                    │                                 ▼
 inbox ── convert ──► converted               archived / dismissed
   ▲                    │                           │
   └──── restore ───────┴───────── restore ─────────┘
```

- `inbox` — unresolved capture.
- `converted` — manually resolved (task, project, link, or note).
- `archived` — intentionally set aside, still reviewable and restorable.
- `dismissed` — noise set aside separately from archive, restorable.

Restoring an item that has conversion history returns it to `converted`, not
`inbox`, so the resolution record is not lost.

## Manual Resolution Actions

| Action | Result |
| :--- | :--- |
| **Convert to Task** | Creates a Task under a **valid, user-owned Project**. The project is mandatory; orphan tasks are impossible. |
| **New Project** | Creates a Project under a user-owned Discipline. |
| **Link Project** | Associates the item with an existing Project (no new record created). |
| **Discipline** | Associates the item with a Discipline. |
| **Keep as Note** | Marks the item as a classified note; content stays searchable. |
| **Archive / Dismiss** | Moves the item out of the active inbox without deleting it. |
| **Restore** | Returns an archived/dismissed item to its prior lifecycle state. |
| **Edit** | Updates content or kind; never resolves the item. |

Conversion always preserves the original Brain Dump row and records the target
in `converted_to_type`, `converted_to_id`, and `converted_at`.

## API Surface

| Method | Route | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/brain-dump?status=&kind=&search=` | List/filter items (newest first) |
| `POST` | `/api/brain-dump` | Capture item (`content`, optional `kind`) |
| `GET` | `/api/brain-dump/[id]` | Fetch one owned item |
| `PATCH` | `/api/brain-dump/[id]` | Edit content/kind |
| `POST` | `/api/brain-dump/[id]/convert-task` | Convert to Task (`projectId` required) |
| `POST` | `/api/brain-dump/[id]/convert-project` | Create Project (`disciplineId` required) |
| `POST` | `/api/brain-dump/[id]/associate` | Link project/discipline or keep as note |
| `POST` | `/api/brain-dump/[id]/archive` | Archive |
| `POST` | `/api/brain-dump/[id]/dismiss` | Dismiss |
| `POST` | `/api/brain-dump/[id]/restore` | Restore |

Every route derives `userId` from the authenticated server session. No route
accepts a client-supplied user id.

## User Experience

- Prominent quick-capture textarea, focused by default.
- `Ctrl/Cmd + Enter` captures immediately.
- Only content is required; kind is optional.
- Status tabs (All / Inbox / Converted / Archived / Dismissed), kind filter, and
  content search.
- Clear unresolved/processed counts.
- Inline editing, triage panel, archive/dismiss/restore actions.
- Helpful empty states for a clean inbox and for filtered result sets.

## Future Compatibility

The module is intentionally isolated so it can later connect to:

- A global Resolution Engine.
- AI-based classification (as an optional adapter, never a core dependency).
- Duplicate detection.
- Task preparation and project creation workflows.
- Reminder and review workflows.

No AI SDK is imported by the Brain Dump domain or service today.

## End-to-End Flow

1. Capture: type `Set up a nightly database backup` and press `Ctrl + Enter`.
2. The item appears in **Inbox** as `UNRESOLVED`, newest first.
3. Click **TRIAGE** → **TASK**.
4. Select a valid Project (for example `A Project — A Discipline`).
5. Confirm. The server verifies project ownership, creates the Task, and marks
   the item `CONVERTED → TASK`.
6. The original capture remains visible under the **Converted** tab, with a
   `VIEW PROJECT` link and the exact target recorded. Nothing is deleted.
