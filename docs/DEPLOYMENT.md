# Deployment Guide

- Target: Vercel (Next.js App Router)
- Database: Managed PostgreSQL (Neon, Supabase, RDS, or Railway)
- Runtime queries use `DATABASE_URL`; on Neon this must be the pooled `-pooler` URL.
- Migrations use `DATABASE_URL_UNPOOLED`; on Neon this must be the direct URL without `-pooler`.
- Vercel runs `npm run vercel-build`, which applies pending migrations before building the app.
- Required environment variables in the Production scope: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.
- `BETTER_AUTH_URL` must be the canonical HTTPS production URL, for example `https://telos-orcin.vercel.app`.
