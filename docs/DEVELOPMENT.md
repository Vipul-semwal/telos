# Development Guide

## Local Workflow

1. Start database:
   ```bash
   docker compose up -d
   ```
2. Run database migrations:
   ```bash
   pnpm db:migrate
   ```
3. Run Next.js dev server:
   ```bash
   pnpm dev
   ```
4. Run test suite:
   ```bash
   pnpm test
   ```
5. Check types and linting:
   ```bash
   pnpm type-check
   pnpm lint
   ```
