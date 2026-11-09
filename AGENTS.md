# AGENTS.md ? AI CODING AGENT GOVERNANCE & ARCHITECTURE MANUAL

> **MANDATORY READING FOR ALL AI CODING AGENTS AND DEVELOPERS.**
> Before reading, modifying, or creating any code in this repository, you must read and understand this document in its entirety.

---

## 1. PRODUCT PHILOSOPHY & VISION

**Telos** is a personal intelligence system designed to help an operator manage long-term pursuits, understand empirical behavioral progress, track real execution time, and eventually determine what to pursue next.

- **This is NOT a generic task SaaS.** There are no arbitrary tags, boards, gamified confetti, or bloated productivity templates.
- **Longevity:** The system must function reliably for years. Code written today will be maintained and extended by completely different AI coding agents and providers tomorrow.
- **Deterministic Independence:** Core execution tracking, deterministic rule enforcement, authentication, and reporting must operate 100% independently of any AI provider. AI must eventually be an optional, pluggable adapter layer on top of a deterministic domain model. Never make an LLM SDK a dependency of the core domain layer.

---

## 2. MODULAR MONOLITH ARCHITECTURE

The application is architected as a **Modular Monolith** deployed as a single Next.js App Router application backed by PostgreSQL.

### 2.1 Layer Boundaries (Strict Separation of Concerns)

Every module strictly separates responsibilities into four layers:

1. **Presentation Layer (`src/app/`, `src/components/`):** React Server and Client Components. UI rendering, user interaction, accessibility. **Never put business rules or raw database queries inside React components.**
2. **Application Layer (`service.ts`):** Use case orchestration, coordination between domain rules, input processing, and workflow execution.
3. **Domain Layer (`domain/`, `schema.ts`, `validation.ts`):** Business logic, entities, invariant rules, Zod schemas, state transitions. Pure deterministic code.
4. **Infrastructure Layer (`src/infrastructure/`):** Database client, Better Auth instance, logging, external adapters.

### 2.2 Domain Modules

Modules are completely independent and self-contained within `src/modules/`:

1. `auth`: Identity, credentials, server session verification.
2. `disciplines`: Areas of sustained human pursuit.
3. `projects`: Measurable initiatives nested within disciplines.
4. `tasks`: Actionable work items and subtasks with ETA and execution status.
5. `brain-dump`: Quick-capture inbox for raw, unclassified thoughts awaiting triage.
6. `daily-planning`: Today's planned task selection and capacity management.
7. `time-tracking`: Discrete stopwatch working sessions with auditable logs.
8. `reporting`: Derived performance, time aggregation, and velocity analytics.
9. `cockpit`: High-level operational telemetry dashboard.
10. `task-yard`: Optional task workspace for TL;DR, rich-text notes, and permanent recall cards.
11. `notifications`: Reusable scheduling, occurrences, delivery, recurrences, and standalone Notify records.

**Rule for Cross-Module Communication:** Modules must communicate via explicit service interfaces (e.g. `TasksService.list()`). Never import private internal queries or bypass module service boundaries.

---

## 3. STRICT DOMAIN RULES & INVARIANTS

Every AI agent must enforce these invariants in all business logic:

### 3.1 Pursuit Hierarchy
The supported hierarchy is strictly:
$$\text{Discipline} \longrightarrow \text{Project} \longrightarrow \text{Task} \longrightarrow \text{Subtask}$$
- **No further nesting:** A subtask (`parentTaskId !== null`) cannot have child subtasks under any circumstances.
- A subtask must belong to the exact same `projectId` and `userId` as its parent task.

### 3.2 Capacity Constraints
- **Disciplines Limit:** Maximum **3 active disciplines** per user.
- **Projects Limit:** Maximum **3 active projects** per discipline.
- **Daily Planning Limit:** Maximum **4 hours (14,400 seconds)** of planned task allocation per daily plan. This is a limit on planned work, not actual working time.

### 3.3 Time Tracking Invariants
- **Task-Level Only:** Time is recorded exclusively at the task level. Project and discipline durations are dynamically aggregated sums of underlying task sessions. There are **no independent project-level or discipline-level timers**.
- **Single Active Timer:** A user may have **at most one active timer** (where `end_time IS NULL`) at any given moment.
- **Stop ? Complete:** Pressing Stop records the working duration of that session. It does **not** mark the task completed. Task completion is an explicit, separate state change.
- **Integer Seconds:** Durations are strictly stored as integer seconds (`integer`), never floating-point hours or milliseconds.
- **ETA Status:**
  - **Green:** $\text{Actual Duration} \le \text{Estimated Duration}$
  - **Red:** $\text{Actual Duration} > \text{Estimated Duration}$

---

## 4. MULTI-TENANCY & DATA ISOLATION

Every application-owned record belongs to an authenticated user (`user_id`).

1. **Server Derivation Only:** Never trust a `userId` supplied in request bodies, query params, or URL segments. The current `userId` is always derived from `requireAuth()` / server session cookies.
2. **Composite Ownership Checks:** When updating, deleting, or fetching any resource, the SQL query must filter by both `id` AND `userId`.
3. **Foreign Key Integrity:** Child records cannot reference parents owned by another user.
4. **Data Isolation Tests:** All module tests must verify that User A cannot read or mutate User B's records.

---

## 5. AUTHENTICATION & PRIVACY

- **Username-Only Requirement:** The registration and login experience requires **only a username and password**. No email field is ever shown to the user.
- **Synthetic Internal Email:** To satisfy library and database schema constraints, the application constructs a deterministic internal identifier (`username@telos.internal`).
- **Consequences:** Because no email address is collected, there is no automated email-based password recovery. Users must preserve their credentials. Document this trade-off clearly.

---

## 6. DESIGN SYSTEM ? CALM GLASS + WARM PRECISION

The visual identity is calm, precise, and functional. Warm neutral surfaces and deep dark surfaces create a quiet workspace; restrained glass materials establish hierarchy without becoming decoration.

1. **Tokens Only:** All styling must use variables from `src/styles/tokens.css` and Tailwind semantic classes (`bg-background-primary`, `text-foreground-primary`, `surface-panel`, `bg-accent`).
2. **Color Palette:**
   - Light Theme: Primary Background `#F5F3EF`, Raised Surface `#FBFAF7`, Text `#17181B`, Accent `#2563EB`.
   - Dark Theme: Primary Background `#0A0C10`, Raised Surface `#12151A`, Text `#F4F2EE`, Accent `#6EA8FF`.
   - Status: Accessible green, amber, and red tokens carry ETA, warning, and error meaning.
3. **Typography:**
   - Manrope for interface prose and controls.
   - Geist Mono for timers, dates, IDs, metadata, and numerical telemetry (`tabular-nums font-mono`).
4. **Geometric and Material Restraint:**
   - Use the centralized radius scale. Controls are `rounded`; in-flow panels are normally `rounded-2xl`; floating layers may use `rounded-3xl`; circles are reserved for icons, status dots, and round icon actions.
   - Use glass materials only for distinct functional layers: chrome, transient controls, and overlays. In-flow content uses `surface-panel`.
   - No decorative color washes, arbitrary gradients, glowing cards, excessive shadows, pill-shaped badges, or emoji navigation.
   - Motion must clarify state, stay within the token durations, and respect reduced-motion preferences.

---

## 7. CODING AGENT RULES OF ENGAGEMENT

When you are asked to make changes to this codebase, you must abide by the following ten commandments:

1. **Understand Before Editing:** Read this `AGENTS.md` and related module files before touching code.
2. **Never Rewrite Working Modules:** Implement new functionality additively. Do not replace working services or delete working tests.
3. **Zero Unjustified Dependencies:** Do not install any new package without explicit justification.
4. **Never Bypass Authentication or Ownership:** Every query must enforce `userId`. Never write client-only filtering for security.
5. **No Business Logic in React:** Components only render state and trigger server actions or service calls.
6. **No Hardcoded User Data:** Test fixtures must use timestamped, randomized identifiers and clean up after execution.
7. **Adhere to Design Tokens:** Never introduce ad-hoc hex colors or inline styles that violate the calm glass and warm precision system.
8. **Versioned Migrations Only:** Never use destructive schema synchronization (`db push` in production). Always use `pnpm db:generate` followed by `pnpm db:migrate`.
9. **Always Maintain Test Suites:** Any modification to domain logic must be accompanied by updated or new unit/integration tests.
10. **Record Architectural Decisions:** Significant structural, security, or domain changes must be documented in `docs/DECISIONS/`.
