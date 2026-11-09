# Design System: Calm Glass and Warm Precision

## 1. Visual Thesis

Telos should feel like a quiet instrument: warm in ordinary light, deep and
focused in the dark, and precise wherever measured work is shown.

The system uses familiar desktop and productivity patterns so the interface
disappears behind the operator's work. It is not a generic SaaS dashboard. There
are no decorative gradients, gamified accents, ornamental cards, emoji
navigation, or effects that compete with the data.

The design is governed by four principles:

1. **Calm hierarchy:** surfaces separate layers without demanding attention.
2. **Measured precision:** numerical telemetry is visually exact and stable.
3. **Functional material:** glass marks navigation, transient controls, and
   overlays rather than serving as a background decoration.
4. **Accessible restraint:** every state remains legible in both themes, with
   clear focus treatment and motion that can be disabled.

## 2. Color and Surfaces

All color is defined as RGB channels in `src/styles/tokens.css` and consumed
through semantic Tailwind classes. Components must never introduce ad-hoc color
values.

| Role | Light | Dark | Token |
| :--- | :--- | :--- | :--- |
| Primary background | `#F5F3EF` | `#0A0C10` | `--bg-primary` |
| Secondary background | `#ECE9E3` | `#12151B` | `--bg-secondary` |
| Raised surface | `#FBFAF7` | `#12151A` | `--surface-raised` |
| Elevated surface | `#FFFFFF` | `#171B22` | `--surface-elevated` |
| Primary text | `#17181B` | `#F4F2EE` | `--text-primary` |
| Secondary text | `#5B5E66` | `#A8ACB4` | `--text-secondary` |
| Accent | `#2563EB` | `#6EA8FF` | `--accent` |
| Success / ETA green | `#1F8A5B` | `#4AB580` | `--status-success` |
| Warning | `#B26A00` | `#E09B3A` | `--status-warning` |
| Error / ETA red | `#D14343` | `#EB6A6A` | `--status-error` |

Use color by semantic meaning:

- `accent` marks primary actions, active navigation, selection, and focus.
- `eta-green` is used only when actual duration is at or below the estimate.
- `eta-red` is used only when actual duration exceeds the estimate.
- Neutral text and surfaces carry ordinary information. Status color is an
  enhancement, never the only signal.

The atmospheric background glows are low-opacity tokenized effects. They must
remain behind content, never animate, and never become a decorative feature.

## 3. Material and Elevation

Material choice communicates interaction layer:

| Layer | Class | Use |
| :--- | :--- | :--- |
| App chrome | `glass-chrome` | Fixed header and navigation rail |
| In-flow content | `surface-panel` | Cards, task rows, report panels |
| Grouped control | `glass-thin` | Segmented controls and filter groups |
| Transient control | `glass-thick` | Menus, dialogs, command palette, toasts |
| Screen overlay | `glass-overlay` | Dialog and drawer backdrops |

Rules:

- Do not place glass inside glass.
- Do not use glass for ordinary lists, cards, or table rows.
- A screen should normally have one fixed chrome layer and one overlay layer.
- Elevation is restrained. `shadow-control` separates controls; `shadow-window`
  and `shadow-popover` are reserved for floating layers.
- `reduce-transparency` must replace glass with approved solid surfaces.
- Browsers without backdrop-filter must receive the same solid-surface fallback.

## 4. Typography

Manrope is the interface face, loaded through `next/font` and exposed as
`font-sans`. Geist Mono is the technical face, exposed as `font-mono`.

- Use `font-sans` for headings, prose, labels, navigation, and button text.
- Use `font-mono` for timers, dates, IDs, counts, durations, and other numerical
  telemetry.
- Add `tabular-nums` wherever values update or align vertically.
- Reserve uppercase micro-labels for metadata and section context. Do not set
  headings, navigation, buttons, or paragraphs in all caps.
- The type scale is centralized in `tailwind.config.ts`: `display`, `title`,
  `heading`, `subheading`, `body`, `small`, `caption`, and `micro`.

## 5. Shape and Spacing

The radius scale is semantic:

| Token | Radius | Use |
| :--- | ---: | :--- |
| `xs` | 6px | Tiny inline affordances |
| `sm` | 8px | Compact controls |
| `control` (`rounded`) | 10px | Inputs and buttons |
| `md` | 12px | Compact switchers |
| `lg` | 16px | Grouped controls |
| `xl` | 20px | Compact cards |
| `2xl` | 24px | Standard cards and panels |
| `3xl` | 28px | Navigation rail, dialogs, major empty states |
| `full` | 9999px | Icons, status dots, circular icon actions |

Badges are compact status labels and use `rounded-md`; they are not pills. Use
consistent spacing from Tailwind's scale. Avoid arbitrary pixel values unless a
component requires a measured icon or fixed control dimension.

## 6. Motion

- State changes should complete within 150-200ms.
- Larger entrances may use `--duration-slow` (320ms).
- Use `--ease-standard` for ordinary changes and `--ease-emphasized` for
  dialogs and overlays.
- Do not animate continuously except for a running timer or loading indicator.
- Honor `prefers-reduced-motion` and avoid relying on animation to communicate a
  state change.

## 7. Accessibility

- Interactive targets are at least 36px where practical and 40px for primary
  inputs and buttons.
- Every interactive element has a visible `:focus-visible` treatment.
- Icon-only actions require an accessible label and, where space permits, a
  tooltip.
- Dialogs must trap attention visually, expose an accessible title, close with
  Escape, and restore page scrolling when dismissed.
- Running, completed, warning, and error states use text or shape in addition to
  color.
- Verify text and status contrast in both themes before shipping.

## 8. Component Conventions

- `Button`: primary for the main action, secondary for supporting actions,
  outline for bounded alternatives, ghost for low-emphasis actions, danger for
  destructive actions.
- `Card`: `surface` for in-flow content, `glass` only where translucency adds
  hierarchy.
- `Badge`: compact semantic label with no icon unless the icon clarifies state.
- `Input`, `Textarea`, `Select`: visible label, control-height consistency, and
  caption-level help or error text.
- `EmptyState`: one icon, one direct title, one concise explanation, and at most
  one primary action.
- `PageHeader`: module context, clear title, concise purpose, optional status and
  actions.

## 9. Implementation Contract

- Tokens belong in `src/styles/tokens.css`.
- Semantic Tailwind mappings belong in `tailwind.config.ts`.
- Shared component behavior belongs in `src/components/ui/`.
- Theme and transparency preferences persist through
  `src/components/theme/theme-provider.tsx`.
- Do not hardcode theme colors in components. The few values required by browser
  metadata, such as `themeColor`, must match the primary background tokens.
