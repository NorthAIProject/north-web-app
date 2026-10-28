# North Web — Design System

## Design direction

The interface is dark-first, quiet, information-dense, and legible. Use muted surfaces and restrained accent colors to make trends and exceptions prominent. Avoid gradients, excessive shadows, decorative glass effects, and color-coded dashboards that cannot be understood by users with low contrast or color-vision differences.

## Semantic tokens

Define tokens as CSS custom properties in the global stylesheet, then expose the palette to Tailwind v4 with `@theme` where utility classes are useful. Keep semantic names stable even if the underlying hue changes.

Recommended token families:

| Token | Role |
| --- | --- |
| `--color-background` | app canvas |
| `--color-surface` | cards and panels |
| `--color-surface-raised` | menus, dialogs, focused surfaces |
| `--color-border` | default separators |
| `--color-border-strong` | selected and emphasized boundaries |
| `--color-foreground` | primary text |
| `--color-muted-foreground` | secondary text, metadata |
| `--color-accent` | primary action and selected state |
| `--color-positive` | completed/healthy trend, never the sole success signal |
| `--color-warning` | attention or incomplete data |
| `--color-destructive` | destructive action or error |

Light mode is supported as a theme, but dark mode is the design baseline. Use `color-scheme`, system preference on first load, and an explicit user override without causing a flash or hydration mismatch.

## Typography and spacing

Use one highly legible sans family for interface text, with a tabular-number treatment for metrics. Establish a compact scale rather than styling each widget independently. Use a 4px base spacing rhythm, with larger layout gaps at section boundaries. Metric values should have enough size and weight to scan quickly; labels should remain readable at 200% zoom.

Use a small radius for controls and a slightly larger radius for cards and dialogs. Borders carry most of the hierarchy; shadows are reserved for overlays and should be subtle in dark mode.

## Layout and responsive behavior

Use mobile-first CSS. The dashboard should remain useful at narrow widths by allowing cards to stack, timelines to collapse into a single column, and chart legends to move below the plot. Prefer content-driven grid changes over device-specific assumptions. Treat 768px and 1024px as useful layout thresholds, not as hard device categories.

Navigation must support keyboard use, visible focus, and a mobile drawer/sheet. Do not hide critical actions solely behind hover. Maintain a comfortable touch target of approximately 44px for primary controls.

## Component conventions

- Every interactive component has a visible focus state and an accessible name.
- Use Bits UI for focus management, modal behavior, menus, popovers, tabs, comboboxes, and other interaction-heavy primitives.
- Use shadcn-svelte for styled, app-owned primitives. Keep variants small and semantic.
- Prefer `MetricTile` for one metric plus context, `Card` for a bounded information group, and `ChartFrame` for title, range, legend, loading, and error conventions around a chart.
- Loading skeletons preserve the final layout shape. Empty states explain why data is absent and what the user can do next. Error states explain recovery without exposing backend details.
- Dialogs and drawers are for focused tasks; avoid putting long, multi-step health workflows in a tiny modal.

## Visualization rules

Charts must show units, date range, timezone/aggregation, and data freshness when relevant. Use a consistent color mapping for metric families. Include non-color encodings such as labels, patterns, position, or line style. Provide a textual summary and a table or accessible description for important trends.

Use SVG with `viewBox`, responsive sizing, and `prefers-reduced-motion` handling for custom graphics. Keep animation short and purposeful: enter/transition changes only when they clarify a change in state. Disable non-essential motion for reduced-motion users.

## Accessibility and motion

Target WCAG 2.2 AA contrast for text and meaningful UI boundaries. Test keyboard navigation, focus return from dialogs, screen-reader names, reduced motion, zoom, and mobile viewport behavior. Never communicate a health status through hue alone.

Default motion should be opacity/transform transitions under 200ms for small interactions and spring-like movement only where spatial continuity is useful. Respect `prefers-reduced-motion: reduce` by removing parallax, large movement, and looping animation.
