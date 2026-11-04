# Authentication Architecture & Username Strategy

## 1. Requirements

- Username and password registration only.
- No required or exposed email field in registration or profile management.
- Cryptographic password hashing managed by Better Auth.
- Secure HTTP-only server-managed session cookies.
- Server-side route protection.

## 2. Better Auth & Synthetic Internal Identifiers

Better Auth's core user schema and database adapter enforce a `NOT NULL` and `UNIQUE` constraint on the `email` column.

To maintain strict username-only registration without modifying library internals or compromising security:
1. When a user submits `{ username: "operator_01", password: "..." }`, the server generates a synthetic internal identifier:
   $$\text{internalEmail} = \text{username.toLowerCase()} + \text{"@telos.internal"}$$
2. The account is created with `name = username`, `username = username`, and `email = internalEmail`.
3. When signing in, the user enters their username and password. Better Auth's `username` plugin (`signInUsername`) authenticates them against the unique username index.
4. The synthetic email is never rendered in any UI component or exposed to the user.

## 3. Security & Operational Consequences

- **Privacy:** No personal contact information or email address is collected or stored.
- **Account Recovery Trade-off:** Because no email address is collected, automated password recovery via email is **not possible**. If a user loses their password, the account cannot be recovered automatically.
- **Session Derivation:** The authenticated user ID is always extracted server-side using `requireAuth()` via `getServerSession()`. Browser-supplied user IDs are never trusted.
