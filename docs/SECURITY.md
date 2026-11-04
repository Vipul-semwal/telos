# Security & Multi-Tenant Data Isolation Policy

## 1. Zero Trust in Client Parameters

Every mutation, read, or deletion query must resolve the user's identity from `getServerSession()`:
```ts
const session = await requireAuth();
const userId = session.user.id;
```
Never accept `userId` from request payloads, form data, URL query params, or client route context.

## 2. Invariant Ownership Checks

When updating or deleting any resource by ID, the SQL query must include both the record ID and the user ID:
```ts
db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
```
If zero rows are affected, throw `NotFoundError` rather than revealing the existence of another user's record.

## 3. Password Hashing & Sessions

Password hashing uses standard secure algorithms (Scrypt/Bcrypt) handled internally by Better Auth. Session tokens are signed, stored in HTTP-only, secure, SameSite cookies.
