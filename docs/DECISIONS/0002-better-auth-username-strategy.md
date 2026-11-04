# ADR 0002: Better Auth Username-Only Registration Strategy

## Status
Accepted

## Context
The product vision requires username and password registration with zero email collection. Better Auth provides first-class session management, password hashing, and a username plugin. However, Better Auth's core user table and signup pipeline require an email column with `UNIQUE` and `NOT NULL` constraints.

## Decision
Generate a synthetic internal identifier (`username.toLowerCase() + "@telos.internal"`) transparently on the backend during registration. Store this in the `email` column to satisfy Better Auth's schema invariants while presenting a strictly username-only registration and login interface to the user.

## Alternatives Considered
1. **Forking or monkey-patching Better Auth:** Fragile, breaks upstream security updates.
2. **Anonymous Plugin:** Does not satisfy the requirement for named account registration.
3. **Custom Authentication from Scratch:** High security risk regarding password hashing, session timing attacks, and cookie rotation.

## Consequences
- **Positive:** Clean username-only UX, zero user PII collected, robust Better Auth session security.
- **Negative:** Automated email-based password recovery is impossible. Documented as an intentional trade-off for privacy.
