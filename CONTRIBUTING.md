# Contributing to Telos

Thank you for contributing to Telos. This codebase is governed by strict architectural principles to ensure multi-year maintainability.

## Principles

1. **Read AGENTS.md First:** All contributors and coding agents must read `AGENTS.md` before writing code.
2. **Modular Monolith Discipline:** Keep modules isolated. Never import internal private implementation details across module boundaries.
3. **Strict Quality Gates:** Before submitting any pull request or committing changes, ensure all four checks pass:
   ```bash
   pnpm type-check
   pnpm lint
   pnpm test
   pnpm build
   ```
4. **Data Isolation Tests:** Every new endpoint or service method that accesses user-owned data must include a test asserting that unauthorized users are rejected.
5. **No Ad-Hoc Styling:** Use tokens from `src/styles/tokens.css`.
