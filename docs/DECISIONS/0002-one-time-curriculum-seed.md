# 0002: One-Time Curriculum Seed

## Context

The mathematics curriculum is being imported once into an existing production user's workspace. Normal application startup and every Vercel deployment must not recreate the curriculum or duplicate records.

## Decision

- Curriculum content lives in a typed server-side fixture.
- `DataSeedService` imports it through the existing module services in one database transaction.
- `data_seed_runs` records completion using a unique `(user_id, seed_key)` constraint.
- The Vercel build runs `seed:math` on every deployment, but the script exits immediately unless `SEED_MATH_ROADMAP=true`.
- The seed row and a per-user database row lock prevent duplicate imports across concurrent or repeated runs.
- The target account is resolved by username and all records retain that user's ownership.

## Consequences

The one-time seed requires a single Production redeploy with `SEED_MATH_ROADMAP=true`. The variable can then be removed. Leaving it enabled is safe because the completion marker makes later runs no-ops.
