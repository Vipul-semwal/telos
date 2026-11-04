# Design System Specification ? Braun / Rams + Nothing Personality

## 1. Aesthetic Philosophy

Telos rejects generic SaaS tropes:
- No rounded-pill badges.
- No decorative purple or blue gradients.
- No heavy floating card drop shadows.
- No emoji navigation menus.
- No simulated physical hardware knobs.

The design embodies **Dieter Rams' Ten Principles of Good Design**:
- Honest, unobtrusive, functional restraint.
- Minimal radii (`0px` to `2px`).
- Monospace technical typography for quantitative telemetry.
- Purposeful, restrained borders communicating logical grouping.

## 2. Color Palette & Semantic Tokens

### Light Theme (Default)
- **Primary Background:** `#F2F1ED` (`--bg-primary`)
- **Primary Text:** `#111111` (`--text-primary`)
- **Secondary Text:** `#777777` (`--text-secondary`)
- **Secondary Surface:** `#E9E8E3` (`--bg-secondary`)
- **Accent:** `#D9342B` (`--accent`)
- **Success:** `#1E6B38` (`--status-success` & `--eta-green`)
- **Error:** `#D9342B` (`--status-error` & `--eta-red`)
- **Border:** `#D6D4CD` (`--border`)

### Dark Theme
- **Primary Background:** `#111111` (`--bg-primary`)
- **Primary Text:** `#F2F1ED` (`--text-primary`)
- **Secondary Text:** `#A0A09B` (`--text-secondary`)
- **Secondary Surface:** `#202020` (`--bg-secondary`)
- **Accent:** `#D9342B` (`--accent`)
- **Success:** `#2E7D32` (`--status-success` & `--eta-green`)
- **Error:** `#D9342B` (`--status-error` & `--eta-red`)
- **Border:** `#2D2D2D` (`--border`)

## 3. Typography

- **Interface Prose:** Geist Sans (`font-sans`).
- **Timers, Quantitative Data & Telemetry:** Geist Mono (`font-mono`) with OpenType tabular numerals (`tabular-nums`) to prevent horizontal jittering during live count increments.
