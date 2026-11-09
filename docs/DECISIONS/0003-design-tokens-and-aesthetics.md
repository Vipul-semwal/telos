# ADR 0003: Braun / Dieter Rams & Nothing Design Tokens

## Status
Superseded by [ADR 0005](./0005-calm-glass-visual-system.md)

## Context
Generic SaaS templates and AI-generated component libraries tend to default to rounded pill buttons, heavy drop shadows, decorative color gradients, and arbitrary spacing. Telos requires a timeless, disciplined, and utilitarian aesthetic.

## Decision
Adopt a centralized CSS token system inspired by Dieter Rams' functional restraint and Nothing's precision. Centralize all variables in `src/styles/tokens.css` with semantic mappings in `tailwind.config.ts`. Restrict border radii to `0px` or `2px`. Standardize on Geist Sans for interface copy and Geist Mono (with `tabular-nums`) for numerical and time data.

## Consequences
- **Positive:** Distinctive, durable, functional visual identity. Eliminates random style inconsistencies between modules.
- **Negative:** Developers cannot quickly drop in off-the-shelf styled component libraries without reviewing and conforming them to tokens.
