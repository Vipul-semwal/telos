# ADR 0001: Modular Monolith Architecture

## Status
Accepted

## Context
Telos is intended to be a multi-year personal intelligence application. It must support gradual addition of advanced modules (Self, Learning, Knowledge, AI Intelligence) without rewriting the core application. Microservices, Redis, Kafka, and premature distributed systems introduce severe operational overhead, deployment complexity, and fragile boundaries for an early-stage product.

## Decision
Adopt a Modular Monolith inside Next.js App Router backed by PostgreSQL. Each domain module encapsulates its own schemas, domain types, invariants, validation, and services. Modules communicate exclusively through explicit service interfaces.

## Alternatives Considered
1. **Microservices:** Rejected due to operational complexity, network latency, distributed transaction issues, and high deployment overhead.
2. **Standard Unstructured Next.js Monolith:** Rejected because scattering database queries and domain logic directly inside React components causes massive technical debt and prevents AI coding agents from reasoning about the codebase.

## Consequences
- **Positive:** Single deployment target (Vercel + Managed Postgres), simple local development via Docker Compose, clear boundaries for AI agents, zero network overhead between modules.
- **Negative:** Strict discipline required to prevent cross-module schema leakage; enforced via code review and lint rules.
