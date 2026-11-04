# Coding Standards

- TypeScript strict mode: No implicit `any`, no unused `@ts-expect-error`.
- Explicit return types on exported service methods.
- Validate all user and external inputs with Zod schemas.
- Domain logic in `src/modules/*/service.ts`, never in React components.
- Zero ad-hoc styling: Use tokens in `src/styles/tokens.css`.
