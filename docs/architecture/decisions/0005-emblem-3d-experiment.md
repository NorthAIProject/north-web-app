# ADR 0005: 3D emblem as a beta-only experiment

- Status: accepted (experiment)
- Date: 2026-11-13
- Tracking: north-web-app#7

## Context

The emblem is a flat SVG everywhere. We want to see the same emblem as a
real-time 3D model before deciding whether it belongs in production. The
brand rules forbid rotating the emblem or adding glow to it, so the
experiment has a written exception in `docs/brand/README.md`. That exception
is limited to beta builds and the login screen.

## Decision

- **Model.** The source is `Khepri_V2_Emblem_3D.glb`, an outside file treated
  as untrusted data. `scripts/brand/emblem_3d.py` uses only the standard
  library and is rerunnable. It parses the GLB, restyles materials to the
  `app.css` tokens, and writes a quantised web GLB, an iOS USDZ and
  `emblem-rig.json` to the git-ignored `out/emblem-3d/`. The web copy is
  packed with gltfpack and committed with its hash in the name to
  `static/assets/models/`, the same as the body map.
- **Motion is data.** `design/emblem-motion.json` is the canonical copy.
  Byte-for-byte copies live in `src/lib/emblem3d/` and in north-ios
  `khepri/Resources/`. Each client has one pure driver that turns a time into
  values without importing a renderer: `src/lib/emblem3d/emblem-motion.ts`
  and `EmblemMotion.swift`. Both test suites assert the numbers in
  `design/emblem-motion.fixtures.json`. `scripts/brand/emblem-guard.sh`
  fails CI if a copy drifts. north-ios CI compares its copy with this repo's
  `main`, so the web side merges first.
- **Web.** `src/lib/emblem3d/scene.ts` is the only module of this feature that
  imports `three`; the muscle viewer keeps its own import, and the pin stays at
  0.169.0. `AuthShell` renders a `.emblem-3d` div whose flat emblem is painted
  by app.css, so it is the first paint. An attachment lazily imports
  `src/lib/emblem3d/mount.ts`, which checks reduced motion and Save-Data, then
  dynamically imports the scene. The canvas replaces the flat emblem only after
  a frame has drawn (`data-live`). Rendering pauses off-screen and in a hidden
  tab. No WebGL, a failed load or a lost context leaves the flat emblem. There
  is one canvas per page, and the lights take their colours from the CSS
  tokens.
- **Gating.** `EMBLEM_3D_MODEL_URL` is a server variable, empty in production
  and set only in `wrangler.jsonc` `env.beta`, the `khepri-web-beta` Worker on
  workers.dev. The root layout's server load passes it to pages as
  `emblem3dModel`, so no client chunk changes with it.
  The size budget (`scripts/size-budget.mjs`) does not let a route's initial
  JS grow; only the lazy total may.
- **iOS.** A non-AR `RealityView` with a virtual camera is drawn transparent
  over SwiftUI. It is compiled for Debug and Beta (`BETA` flag) and excluded
  from Release with `EXCLUDED_SOURCE_FILE_NAMES`.
  `scripts/verify-release-excludes.sh` proves the exclusion.

## Consequences

Production is unchanged until the owner judges the emblem on a device.
Promoting it means setting the URL in production, removing the iOS exclusion,
and narrowing the brand exception, each as its own reviewed change. If the
experiment is dropped, deleting `src/lib/emblem3d/`, the `.emblem-3d` CSS,
the AuthShell block, the model and the beta env removes it completely.
