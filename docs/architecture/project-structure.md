# North Web — Project Structure

```text
src/
├── app.d.ts
├── app.html
├── hooks.server.ts
├── hooks.ts
├── routes/
│   ├── (public)/
│   ├── (app)/
│   │   ├── +layout.server.ts
│   │   ├── +layout.svelte
│   │   ├── dashboard/
│   │   ├── timeline/
│   │   ├── metrics/
│   │   ├── workouts/
│   │   ├── sleep/
│   │   ├── nutrition/
│   │   ├── hydration/
│   │   ├── goals/
│   │   └── coach/
│   ├── +layout.svelte
│   └── +error.svelte
└── lib/
    ├── api/
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── feedback/
    │   └── visualization/
    ├── features/
    │   ├── dashboard/
    │   ├── activity/
    │   ├── sleep/
    │   ├── nutrition/
    │   ├── goals/
    │   └── coach/
    ├── queries/
    ├── schemas/
    ├── styles/
    ├── types/
    └── utils/
```

## Responsibilities

- `src/routes`: URL ownership, route load/actions, layouts, auth boundaries, and page composition. Keep domain logic out of route files.
- `src/lib/components/ui`: shadcn-svelte and app-owned primitives. These components are generic and do not import feature API modules.
- `src/lib/components/layout`: app shell, sidebar, top bar, responsive navigation, and page container.
- `src/lib/components/feedback`: skeletons, empty states, errors, stale-data indicators, and toasts.
- `src/lib/components/visualization`: generic chart frames, axes helpers, legends, rings, and SVG primitives.
- `src/lib/features`: feature-oriented components, view models, and feature-local helpers. A feature may import shared components and its own API/query modules, but shared components must not import features.
- `src/lib/api`: typed HTTP client and resource functions. No UI code, no Svelte reactivity.
- `src/lib/queries`: TanStack Query key factories, query options, and mutation helpers. Keep query behavior close to the domain but independent from page markup.
- `src/lib/schemas`: Zod schemas for forms and risky API boundaries. Co-locate a schema in a feature when it is not shared.
- `src/lib/types`: stable domain/view types that are intentionally shared. Generated OpenAPI types can live in a generated subdirectory and should be mapped to UI types at the API boundary.
- `src/lib/utils`: pure formatting, date, unit, accessibility, and request helpers. No hidden global state.
- `src/lib/styles`: global CSS, token definitions, Tailwind entrypoint, and reduced-motion/accessibility rules.

## Naming conventions

- Svelte components: `PascalCase.svelte`.
- TypeScript modules: `kebab-case.ts` or a clearly named domain module; use one convention consistently.
- Route files follow SvelteKit names exactly: `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+error.svelte`.
- Query keys use lowercase domain nouns and structured input objects: `['sleep', { date, range }]`.
- API functions use verbs that describe the resource operation: `getSleepSummary`, `updateGoal`.
- Types use nouns; schemas end in `Schema`; test files use `.spec.ts` or `.spec.svelte`.

## Avoiding abstraction debt

Start with a feature-local module. Promote code to `components`, `utils`, `types`, or `queries` only after two or more features share the same contract. Do not create “services”, “repositories”, and “managers” that merely forward calls. Prefer a small number of explicit boundaries over a deep architecture ceremony.
