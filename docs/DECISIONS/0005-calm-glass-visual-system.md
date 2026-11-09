# ADR 0005: Calm Glass Visual System and Warm Precision

## Status
Accepted

Supersedes [ADR 0003](./0003-design-tokens-and-aesthetics.md).

## Context
The original Braun / Nothing treatment made every surface, label, and control
share the same industrial visual weight. That restraint was useful as a
foundation, but it made dense operational views harder to scan and gave transient
layers too little hierarchy.

Telos still needs a durable, precise interface rather than a generic SaaS
dashboard. The visual system must support long work sessions, foreground measured
execution, and remain legible in both light and dark environments.

## Decision
Adopt a calm glass visual system built on warm precision:

- Warm neutral backgrounds and deep cool dark backgrounds replace the
  near-monochrome paper palette.
- A restrained blue accent communicates interactive state. Green, amber, and red
  remain reserved for semantic status.
- Glass materials are limited to chrome, transient controls, and overlays.
  In-flow content uses opaque or lightly translucent semantic surfaces.
- Manrope is the primary interface face. Geist Mono remains mandatory for
  timers, dates, IDs, and quantitative telemetry.
- A centralized radius scale replaces the previous 0-2px restriction. Shape
  communicates layer type rather than acting as decoration.
- Motion is brief and functional, with reduced-motion, reduced-transparency,
  and no-backdrop-filter fallbacks.

All colors, materials, shadows, spacing primitives, and motion values must remain
semantic tokens in `src/styles/tokens.css` and `tailwind.config.ts`.

## Consequences
- **Positive:** Dense views gain clearer hierarchy without becoming noisy.
  Operator-facing surfaces feel calmer, while measured execution remains precise
  and legible.
- **Positive:** Light, dark, reduced-transparency, and reduced-motion modes share
  one token contract.
- **Negative:** Glass and elevation can be overused. Contributors must follow the
  layer rules in `docs/DESIGN_SYSTEM.md` and avoid introducing one-off effects.
