# Deployment Guide

- Target: Vercel (Next.js App Router)
- Database: Managed PostgreSQL (Neon, Supabase, RDS, or Railway)
- Run migrations during build / deployment pipeline: `pnpm db:migrate`
- Required environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
