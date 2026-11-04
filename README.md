# Telos ? Personal Intelligence System

> **A long-term personal intelligence architecture and pursuit cockpit.**  
> Built with Next.js App Router, TypeScript (Strict), PostgreSQL, Drizzle ORM, and Better Auth.

---

## 1. Overview & Philosophy

Telos is **not** a generic task SaaS, project management Kanban board, or gamified to-do list.

It is an empirical personal intelligence system designed to:
- Structure long-term human pursuits into clear **Disciplines** and measurable **Projects**.
- Track discrete work execution through auditable **Time Sessions** at the task level.
- Restrict daily planning to a sustainable **4-hour planned work capacity** to prevent burnout.
- Surface objective operational velocity and behavioral progress without subjective vanity metrics.
- Maintain **100% deterministic operation**, running independently of any external AI provider.

The codebase is built as a maintainable **Modular Monolith** engineered to be understood and extended by future human engineers and AI coding agents alike.

---

## 2. Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.3.9 (App Router) | High-performance React Server Components & API routes |
| **Language** | TypeScript 5.9.3 (Strict Mode) | Strong compile-time type safety and domain invariant checks |
| **Runtime** | Node.js v24 LTS | Long-term support, stable performance |
| **Package Manager** | pnpm 11.25.0 | Pinned, deterministic dependency tree |
| **Database** | PostgreSQL 16 (Alpine) | Robust ACID relational integrity, composite constraints |
| **ORM & Migrations** | Drizzle ORM 0.45.4 & Drizzle Kit | Typesafe queries with explicit, versioned SQL migrations |
| **Authentication** | Better Auth 1.7.15 (Username Plugin) | Secure session management with username-only privacy |
| **Validation** | Zod 3.24.2 | Runtime schema validation across domain layers |
| **Styling** | Tailwind CSS 3.4.19 | Centralized CSS design tokens (Braun / Nothing aesthetic) |
| **Testing** | Vitest 3.2.7 & Playwright 1.64.1 | Fast unit/integration test suites & end-to-end testing |
| **Local Infrastructure**| Docker Compose | Isolated containerized database with health check |

---

## 3. Pursuit Hierarchy & Invariants

```text
DISCIPLINE (Max 3 active per user)
   ??? PROJECT (Max 3 active per discipline)
          ??? TASK (Integer seconds ETA, time tracked)
                 ??? SUBTASK (Parent depth = 1, no further nesting)
```

- **Daily Planning Limit:** 4 hours (14,400 seconds) max planned allocation per day.
- **Stopwatch Rule:** Exactly one active timer per user at any time. Stopping a timer pauses recording; it does **not** complete the task.
- **ETA Status:**
  - **Green:** Actual duration $\le$ Estimated duration.
  - **Red:** Actual duration $>$ Estimated duration.

---

## 4. Getting Started

### Prerequisites

- Node.js LTS (v20+ or v24)
- pnpm (`corepack enable pnpm` or `npm install -g pnpm`)
- Docker & Docker Compose

### 1. Clone & Install Dependencies

```bash
git clone <repo_url>
cd Telos
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Verify the default values:
- `DATABASE_URL=postgresql://telos_user:telos_password@localhost:5432/telos`
- `BETTER_AUTH_SECRET=<min-32-chars-secret>`
- `BETTER_AUTH_URL=http://localhost:3000`

### 3. Start PostgreSQL with Docker Compose

```bash
docker compose up -d
```

Verify database health:
```bash
docker compose ps
```

### 4. Apply Database Migrations

```bash
pnpm db:migrate
```

### 5. Launch Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to register a new account (username and password only).

---

## 5. Verification Commands

All changes must pass the four-stage quality gate:

```bash
# 1. Type checking (strict mode)
pnpm type-check

# 2. Linting (ESLint 9 + Next.js core vitals)
pnpm lint

# 3. Test suites (Unit & Integration tests)
pnpm test

# 4. Production build
pnpm build
```

---

## 6. Repository Architecture

```text
Telos/
??? AGENTS.md                  # Central instructions for AI coding agents
??? README.md                  # This file
??? CONTRIBUTING.md            # Guidelines for contributors
??? docker-compose.yml         # Containerized PostgreSQL service
??? drizzle.config.ts          # Drizzle Kit migration configuration
??? next.config.ts             # Next.js configuration
??? package.json               # Pinned dependencies
??? tsconfig.json              # Strict TypeScript configuration
??? vitest.config.ts           # Vitest unit/integration configuration
??? playwright.config.ts       # Playwright E2E configuration
??? docs/                      # Technical documentation & ADRs
?   ??? ARCHITECTURE.md
?   ??? AUTHENTICATION.md
?   ??? DATABASE.md
?   ??? DESIGN_SYSTEM.md
?   ??? SECURITY.md
?   ??? DECISIONS/             # Architecture Decision Records (ADRs)
?   ??? FEATURES/              # Feature specifications
??? drizzle/                   # Versioned SQL migration files
??? src/
?   ??? app/                   # Next.js App Router (pages & route handlers)
?   ??? components/            # UI primitives & layout shells (Braun / Nothing tokens)
?   ??? infrastructure/        # Database, Auth, Logging adapters
?   ??? modules/               # Self-contained domain modules
?   ?   ??? auth/
?   ?   ??? disciplines/
?   ?   ??? projects/
?   ?   ??? tasks/
?   ?   ??? brain-dump/
?   ?   ??? daily-planning/
?   ?   ??? time-tracking/
?   ?   ??? reporting/
?   ?   ??? cockpit/
?   ??? shared/                # Common types, errors, duration & date utils
?   ??? styles/                # tokens.css & globals.css
??? tests/
    ??? unit/                  # Domain rule & validation tests
    ??? integration/           # Multi-tenant data isolation tests
    ??? e2e/                   # Browser authentication & journey tests
```

---

## 7. Documentation Index

- [AGENTS.md](./AGENTS.md): Coding agent governance & development invariants.
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): Modular monolith layer boundaries.
- [docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md): Better Auth username plugin strategy.
- [docs/DATABASE.md](./docs/DATABASE.md): Schema design & integrity constraints.
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md): Braun / Nothing design tokens.
- [docs/DECISIONS/](./docs/DECISIONS/): Formal architectural decision logs.
