# Telos

Telos is a personal operating system for long-term pursuits, deliberate
planning, measured execution, and evidence-based review.

It is a modular Next.js application backed by PostgreSQL. Core behavior is
deterministic and AI-independent.

## Operating Loop

```text
Capture → Triage → Project/Task → Plan → Execute → Measure → Decide
```

## Features

- Username-only authentication and isolated per-user data.
- Disciplines, projects, tasks, and one-level subtasks.
- Optional Task Yard for each task: TL;DR, rich-text notes, flashcards,
  reminders, review history, and scheduled recall.
- Universal Brain Dump capture and manual triage.
- Daily planning with a strict four-hour planned-work limit.
- Task-level stopwatch tracking with one active timer.
- Notify module for standalone and recurring notifications.
- Shared scheduling engine for Notify and Task Yard.
- Cockpit next-action guidance and one-at-a-time due notifications.
- Derived project, discipline, daily, and ETA reporting.
- Light, dark, system, and reduced-transparency modes.

## Hierarchy and Rules

```text
Discipline → Project → Task → Subtask
```

- Maximum 3 active disciplines per user.
- Maximum 3 active projects per discipline.
- No subtasks beneath subtasks.
- Maximum 4 hours of planned work per day.
- One task-level timer per user.
- Stopping a timer records time without completing its task.
- ETA uses cumulative task duration.

## Quick Start

Requirements: Node.js 20+, pnpm, Docker, and Docker Compose.

```bash
git clone git@github.com:Vipul-semwal/Telos.git
cd Telos
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`.

No email is collected. Accounts use a username and password only, so automated
password recovery is unavailable.

## Daily Use

1. Define up to three active disciplines.
2. Create projects with measurable outcomes.
3. Break projects into tasks and optional subtasks.
4. Use Task Yard for notes and recall work specific to a task.
5. Capture unknown inputs in Brain Dump, then triage them.
6. Plan no more than four hours of work.
7. Run the task-level timer and inspect reports.
8. Use Notify and Cockpit for scheduled attention.

## Commands

```bash
pnpm dev                    # development server
pnpm build                  # production build
pnpm type-check             # TypeScript
pnpm lint                   # ESLint
pnpm test                   # unit and integration tests
pnpm test:e2e               # Playwright browser tests
pnpm db:generate            # generate a Drizzle migration
pnpm db:migrate             # apply migrations
pnpm notifications:process  # materialize due schedules
```

## Architecture

The codebase is a modular monolith:

- `src/app`: routes, pages, and API handlers.
- `src/components`: shared presentation primitives.
- `src/modules`: domain services, schemas, validation, and module UI.
- `src/infrastructure`: database, authentication, and logging.

Modules communicate through public service interfaces. Every application-owned
row is scoped to the authenticated user.

Task Yard and Notify share one scheduling engine:

```text
Source → Schedule → Occurrence → Delivery → Cockpit
```

Only Cockpit delivery is implemented. The destination interface is extensible
for future channels.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database](./docs/DATABASE.md)
- [Design system](./docs/DESIGN_SYSTEM.md)
- [Task Yard and Notify](./docs/FEATURES/TASK_YARD_NOTIFY.md)
- [Architecture decisions](./docs/DECISIONS/)
- [AI and developer governance](./AGENTS.md)
