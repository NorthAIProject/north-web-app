# ADR 0006: 3D mascot as a beta-only experiment

- Status: accepted; promoted to production 2026-11-13
- Date: 2026-11-13
- Tracking: north-web-app#10

## Context

The mascot is a flat cutout of the idle pose everywhere (`Mascot.svelte`,
iOS `KhepriMascot`). After the 3D emblem (ADR 0005), we want to see the
mascot as a real-time 3D character before deciding whether it belongs in
production. The brand rules allow the mascot only a hover and a core glow, so
the experiment has a written exception in `docs/brand/README.md`, limited to
beta builds and onboarding.

This ADR follows ADR 0005 everywhere it can. Only the differences are spelled
out below.

## Decision

- **Model.** The source is `Khepri_V2_Mascot_Mobile.glb` (79 named parts,
  `NN_NN_PART__Material`), an outside file treated as untrusted data. The Hero
  file has the same parts at three times the size, so it is not used.
  `scripts/brand/mascot_3d.py` reuses the reader, normals and colour maths of
  `emblem_3d.py`. It restyles each part by its material suffix to the
  `app.css` tokens. It groups parts into joints by name prefix: `body` (the
  root), `core` (the solar core), `head`, `eyes` (glass and glow) and `pupils`
  (iris rings, pupil and catchlights). Each joint is a node at its pivot, so
  the clients move nodes and never touch vertices. It writes `mascot.glb`,
  `Mascot.usdz` and `mascot-rig.json` to the git-ignored `out/mascot-3d/`.
  The web copy is packed with gltfpack (`-kn` keeps the joint nodes) and
  committed with its hash in the name to `static/assets/models/`.
- **Motion is data.** `design/mascot-motion.json` is canonical. It has an
  entrance, idle tracks (hover on `body`, glow on `core`), a blink schedule
  and look-at limits. The copies, the pure drivers (`mascot-motion.ts`,
  `MascotMotion.swift`), the shared fixtures
  (`design/mascot-motion.fixtures.json`) and the guard
  (`scripts/brand/emblem-guard.sh`, which now checks both files) work as in
  ADR 0005. The blink is a fixed schedule within a cycle, not random, so
  both clients and the fixtures agree to the millisecond.
- **Web.** `src/lib/mascot3d/scene.ts` is this feature's only `three`
  importer. It is separate from the emblem's on purpose, so either
  experiment can be deleted alone. The mascot renders only on
  `/app/onboarding`. That page's server load returns `emblem3dModel: null`
  (page data overrides layout data), so the AuthShell emblem stays flat
  there and the page keeps one WebGL context. The `.mascot-3d` div paints the
  flat idle art from app.css as the first paint, and `mount.ts` adds the
  canvas after the same reduced-motion and Save-Data checks as the emblem.
- **Gating.** `MASCOT_3D_MODEL_URL` is a server variable, empty in production
  and set only in `wrangler.jsonc` `env.beta`. Only the onboarding page's
  server load reads it. The gate (an `{#if}`, a div and a lazy-import
  attachment) grows that one route's initial JS; the exact bytes are
  recorded in `size-budget.json` `notes`. No other route changes.
- **iOS.** `Mascot3DView` (a non-AR `RealityView` with a virtual camera)
  replaces `KhepriMascot` on the onboarding Welcome step in Debug and Beta.
  Release excludes the view, `MascotMotion.swift`, `Mascot.usdz` and
  `mascot-motion.json` with `EXCLUDED_SOURCE_FILE_NAMES`, and
  `scripts/verify-release-excludes.sh` checks them alongside the emblem.

## Consequences

Seeing it needs an account that has not finished onboarding: a new sign-up
on the beta Worker (which talks to the production API) or a fresh install of
the Beta app. Production is unchanged until the owner judges the mascot on a
device. Promoting it means setting the URL in production, removing the iOS
exclusion and narrowing the brand exception, each as its own reviewed change.
If the experiment is dropped, deleting `src/lib/mascot3d/`, the `.mascot-3d`
CSS, the onboarding gate, the model and the beta env removes it completely.

## Promotion (2026-11-13)

The owner promoted this to production before the planned device check.
`wrangler.jsonc` sets the model URL in the top-level vars, so kheprios.com
serves the 3D version; the iOS Release configuration no longer excludes the
files (north-ios). Emptying the URL turns the web version off again without
a code change.
