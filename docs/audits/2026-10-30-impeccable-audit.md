# Web app audit — 2026-10-30

Commit audited: `dbd6710` (main, navy + gold rebrand merged; `2a2cf42` added only CI since).
Method: five read-only passes — accessibility (code), theming + contrast (computed OKLCH → WCAG, both themes), performance (production build + live kheprios.com under mobile throttle), responsive + anti-patterns (code + headless renders at 320/375/390), rendered checks (Playwright + axe on 89 renders: public pages + 22 `/app` routes, en/es/pt-PT, 375/1440, light/dark, reduced motion). Standard: `PRODUCT.md` (product register, WCAG 2.2 AA, 4 locales).

Scratch evidence (screenshots, contrast script, axe JSON): `/private/tmp/claude-502/-Users-fernandocorreiachill-Work-production-apps-north/c323ddbe-74dd-4266-9ce6-421592ab0ecc/scratchpad/` (session-only).

## Health score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Coach send button unnamed, replies never announced, charts have no text alternative, field errors silent |
| 2 | Performance | 2 | Landing LCP 3.1 s on mobile (77 modulepreloads), full ECharts 327 KB gz, 1.5 MB uncompressed body model |
| 3 | Responsive | 2 | Holds at 320 px, but touch is second-class: 28–36 px targets, hover-only actions, chat composer below the fold |
| 4 | Theming | 2 | Core navy/gold pairs pass; light mode fails on tracker colours, red-500 errors, 50 % focus ring; heatmap paints black |
| 5 | Anti-patterns | 2 | `/app` is clean; the landing frame (eyebrow on every section, icon card grid, stat tiles, announcement pill) reads AI-made |
| | **Total** | **10/20** | **Acceptable — significant work needed** |

## Anti-patterns verdict

Split. The product (`/app`) passes the product slop test: Marcellus never in UI, 24 px Geist h1s everywhere, no gradient text, no clamp headings, no bounce, no nested cards, empty states teach. The landing's middle (bearing line, Waypoint distances, operable Day/Muscle/Goal/Platform demos, thread proof card) is specific and opinionated. The frame around it is stock: tracked-caps motto, dot-and-arrow announcement pill, mono eyebrow over all 11 sections (102 tracked labels at 375 px), 5-card icon feature grid, 4-tile stat row, 3 gold big-number cards, icon-circle closing CTA. Remove the frame and the page reads as made by someone with a point of view. Detector also flags Geist as an overused face; no action recommended (iOS parity, product register permits it).

## Findings

Severity: P0 blocks a task · P1 significant difficulty or WCAG AA failure · P2 annoyance · P3 polish. No P0s found.

### P1

**1. Mood heatmap paints low-mood days black** — Theming / data integrity
- where: `src/lib/features/viz/echarts.ts:82`; `src/lib/components/khepri/css-color.ts:62` (only bare `var(--x)` resolved); used by `OverviewPanels.svelte:70`, `insights/mind/MindPanels.svelte:20`, `checkins/LiveRegion.svelte:36`
- impact: `color-mix(in oklch, var(--north-signal) 20%, var(--background))` reaches ECharts unparsed → zrender falls back to `[0,0,0,1]`. Mood-1 days vanish in dark (1.11:1), become heavy black in light; mid values muddy. Data misread on 3 screens.
- fix: resolve any string containing `var(` by painting it through the 1×1 canvas (fillStyle accepts color-mix); unit test that no non-rgba colour reaches `setOption`.
- command: harden

**2. Coach composer: unnamed send, placeholder-only field, invisible edge, iOS zoom**
- where: `src/lib/features/coach/Composer.svelte:122` (icon submit, no aria-label), `:111` (placeholder only), `:90` (sr-only file input still a tab stop), `:118` (`text-[15px]`, `border-transparent`, `rounded-[24px]`)
- impact: screen readers hear "button" on the product's main action; extra invisible tab stop; field edge 1.10:1 light / 1.31:1 dark; 15 px font makes iOS Safari zoom on focus.
- fix: `aria-label={i18n.t('chat.send')}`; label the textarea; file input `tabindex="-1" aria-hidden`; `text-base md:text-[15px]`; `border-input`; `rounded-xl`. Model: `crews/Composer.svelte:105-108`.
- command: harden

**3. Chat output never announced**
- where: `coach/ChatPage.svelte:138` (no log/live region), `coach/StreamingBubble.svelte:13-14` (reply + error silent), `crews/ChatBody.svelte:195`
- impact: screen-reader users hear the status pill change but never the coach's reply or a stream failure; crew messages arrive silently.
- fix: hidden `aria-live="polite"` region written once when the stream closes; stream error `role="alert"`; `role="log"` on crew list.
- command: harden

**4. Coach chat layout: composer below the fold, header eats short viewports**
- where: `coach/ChatPage.svelte:133,140`; `layout/AppShell.svelte:37,113`; chat routes never return `wide: true` (only crews, `space.server.ts:34`); `app.css:470-485,519-528` (scrim 3.5rem+120 px, 110 px avatar)
- impact: at 390×844 the document is 56 px taller than the viewport, composer starts at y=797 (~34 px visible), nested double scroll. Landscape phone / 200 % zoom leaves ~60 px for the transcript.
- fix: return `{ wide: true }` from `/app/chat` and `/app/chat/[id]` (h-dvh shell like crews); under `@media (max-height: 32rem)` collapse avatar into the 56 px bar and drop `pt-[156px]`.
- command: layout

**5. Form controls with no accessible name (primitives + ~15 forms)**
- where: `ui/slider/slider.svelte` (id lands on Root, not the role=slider thumb); `khepri/SearchSelect` / ChoiceSelect with `<Label>` lacking `for` — `routes/(app)/app/calculator/+page.svelte:131,157,167,177`, `goals/GoalFields.svelte:79`, `landing/ToolsDemo.svelte:74-84,105-127`; `friends/+page.svelte:68` (#invite-url); `awards-page/MonthlyCard.svelte:28` (Progress). Placeholder-only: `knowledge/AddNote.svelte:121`, `inbox/+page.svelte:36`, `goals/[id]/+page.svelte:291`, `weekly/+page.svelte:77`, `capture/CapturePanel.svelte:215`, `nutrition/MealVoice.svelte:63,102`, `onboarding/+page.svelte:110`, `training/PickerPanel.svelte:84`, `exercises/+page.svelte:49`, `nutrition/ingredients/+page.svelte:107`, `day/QuickAdd.svelte:121`, `day/RulesDialog.svelte:39`, `training/ImportReview.svelte:106-170`, `planimport/MealReview.svelte:61,206,307`. Orphan labels: `memories/CategoryField.svelte:17`, `settings/ProviderCard.svelte:80` (radios not in fieldset).
- impact: calculator unusable by ear; "combobox"/"slider"/"—" with no purpose; voice control can't target fields. axe critical on 5 routes.
- fix: forward `aria-labelledby`/`id` to `SliderPrimitive.Thumb`; make SearchSelect/ChoiceSelect require a label id; Label `for` or `aria-label` on each field; table inputs `aria-label={`${column} ${exercise}`}`; fieldset+legend for ProviderCard.
- command: harden

**6. Field errors silent, unassociated, and low-contrast**
- where: `auth/FormField.svelte:21-23`; `settings/FieldMessage.svelte`, `nutrition/FieldMessage.svelte`, `social/FieldError.svelte` (3 copies); `checkins/CheckInWizard.svelte:66-70`. aria-invalid in 43 files, aria-describedby in 1. Error colour is Tailwind `red-500` in 26 places (`care/*`, `progress/NewCheck.svelte:225`, `goals/GoalFields.svelte:31`, `decisions/DecisionFormCard.svelte:50`, `memories/*`, `knowledge/AddNote.svelte:88,116,131`, routes calculator/goals/crews/weekly/mind/plans-generate/memories; `settings/CalendarCard.svelte:37`). Destructive Alert description 4.48:1 light.
- impact: after a failed submit nothing is announced; tabbing back says "invalid" without reason; signup password rules never read; red-500 = 3.42:1 bg / 3.61:1 card light, 4.48:1 dark card.
- fix: one shared FieldMessage with `id="{id}-error"`; controls get `aria-describedby` (hint while valid, error when invalid); focus first invalid field or `role="alert"` summary; replace red-500 with `text-destructive`; nudge light `--destructive` to ≥4.5:1 on `--surface`.
- command: harden

**7. Charts have no text alternative (37 instances)**
- where: `khepri/EChart.svelte:42` + `echarts.ts:34` (canvas, `aria` off; 16 hosts); `ui/chart/spec-chart.svelte:100-140` (LayerChart SVG, no role/label; 21 uses)
- impact: insights, overview, goals data exists only as pixels; tooltips pointer-only.
- fix: ECharts `aria: { enabled: true }` with localised description, or `role="img"` + computed summary; ideally a visually hidden table from the same rows.
- command: harden

**8. Keyboard dead ends**
- where: `AppShell.svelte:51-56` + `ui/sidebar/sidebar-group-label.svelte:30` ("More" trigger spread onto a div — never focusable); `coach/ThreadList.svelte:28-33,81` + `ChatHeader.svelte:31-40` (off-screen drawer in tab order, no inert/Escape/aria-expanded); `khepri/SearchSelect.svelte:91-104` (clear span tabindex -1 nested in a button, 14 px, 28 uses); `checkins/CheckInWizard.svelte:78-88,132,138,160` (Next hides focused button → focus to body)
- impact: first-week users can't reach nav under More; keyboard users tab through hidden conversations; can't clear selections; daily check-in restarts focus each step.
- fix: real `<button>` trigger; `inert={!open}` below lg + Escape + focus return; clear button as sibling ≥24 px with translated label (or a "None" option); move focus to the new pane's legend on step change.
- command: harden

**9. Focus indicator too faint or missing**
- where: `ui/button/button.svelte:8`, `ui/badge/badge.svelte:11`, `ui/tabs/tabs-trigger.svelte:17`, `ui/input/input.svelte:60` (`ring-ring/50` = 2.03:1 light on borderless controls); `ui/tabs/tabs-content.svelte:15` (`outline-none` on tabindex=0 panel — invisible stop, rendered at `/` MuscleDemo)
- fix: full-strength `ring-ring` 2 px + `ring-offset-2 ring-offset-background` (as `switch.svelte:28`); visible focus ring on tabs-content.
- command: harden

**10. Collapsed sidebar strips names**
- where: `AppShell.svelte:88-90` (Sign out label `group-data-[collapsible=icon]:hidden`), `:43` (BrandLockup text hidden, BrandMark `alt=""`)
- impact: unnamed sign-out button and home link; wide pages (crews) start collapsed.
- fix: `group-data-[collapsible=icon]:sr-only` or explicit aria-labels.
- command: harden

**11. Light-mode colour failures on trackers, muted text, switches, hover**
- where: `day/view.ts:690-708` → `BodyPanel.svelte:47,76`, `Trends.svelte:73`, `QuickAdd.svelte:111`, `Rail.svelte:50,86`; `day/CardGrid.svelte:148-160` + `view.ts:465-468` (Activity values identified only by 8 px swatch, no unit); `landing/DayDemo.svelte:58`; opacity text in `training/ExerciseRow.svelte:106`, `knowledge/ResultRow.svelte:20`, `fitness/+page.svelte:118`, `knowledge/[id]/+page.svelte:43-55,102`, `insights/timeline/TimelinePanels.svelte:62,95`, `landing/SiteFooter.svelte:72`; `ui/switch/switch.svelte:25-26`; signal hover `button.svelte:12`; `signal/12` badge
- impact (light / dark): tracker text 2.65–3.85:1 / pass; soreness chip 2.91 / 4.31; rail labels 2.44 / 4.11 (sleep); day-now 4.14 / pass; rings carb 1.90, fat 2.65, exercise 1.68, stand 2.06, sun 1.79 (need 3:1); muted /60 /70 /80 = 2.50 / 3.02 / 3.67; switch off-track dark 2.08; hovered primary 4.08–4.31; Pro badge 4.24. Trends signals "met" by colour only.
- fix: keep tracker hues for fills; add darker light-mode text steps (L≈0.45–0.5) under the same token names (iOS sync); unit/letter next to each Activity value (as Food P/C/F); drop opacity on text; switch off-track ~60 % or `--input`; darkening hover token; ✓ or word for "met".
- command: colorize

**12. Landing film: autoplay loop, no pause, ignores reduced motion — and still the old cyan look**
- where: `landing/HeroProof.svelte:63-73`; `landing/herowall.ts:59`; `static/assets/video/north-hero.mp4` + `north-hero-poster.webp`
- impact: WCAG 2.2.2 (Level A) failure; poster is the pre-rebrand cyan/teal HUD on black ("neon on black" anti-reference) next to the navy/gold emblem.
- fix: no autoplay under reduced motion (poster + play); visible pause/play toggle; re-cut film/poster in navy + gold or pull the slot and wall tile until then.
- command: animate (+ colorize for the asset)

**13. Public navbar overflows at 320 px — primary CTA clipped**
- where: `khepri/Navbar.svelte:19-40` (rendered `/`, `/privacy`)
- impact: sideways scroll; "Get started" ends at x=350 (en), "Empezar" 375 (es), "Começar" 331 (pt-PT).
- fix: below sm hide X link + ghost Sign in (or menu), `px-4`, `min-w-0` on the cluster.
- command: adapt

**14. Message actions invisible on touch; chat feedback controls tiny**
- where: `crews/MessageRow.svelte:166` (`opacity-0 group-hover:opacity-100`, no touch path); `coach/MessageFeedback.svelte:37,53`, `coach/Bubble.svelte:53-58` (Copy / Yes / No ~20×16 px, 8 px apart, hover-hidden from sm up)
- impact: react/reply/edit/pin/delete undiscoverable on phones; mis-taps record the wrong feedback.
- fix: `(hover:hover)`-scoped reveal, visible at reduced opacity otherwise (or long-press); feedback as `Button variant="ghost" size="sm"` with coarse-pointer min-h-11.
- command: adapt

**15. Dialog primitive has no max-height or scroll**
- where: `ui/dialog/dialog-content.svelte:29-33`; affected `nutrition/DayCard.svelte:74-124`, `crews/CrewSpace.svelte:391-472`; local vh patches in `day/QuickAdd.svelte:135`, `day/BodyPanel.svelte:88`
- impact: tall dialogs clipped and unscrollable on landscape phones / 200 % zoom.
- fix: `max-h-[calc(100dvh-2rem)] overflow-y-auto` in the primitive; delete the two local patches.
- command: harden

**16. Landing first paint 3.1 s on mobile**
- where: route `/`; `src/app.html:13-15` (3 font preloads); 77 SvelteKit modulepreloads (285 KB) ahead of the single render-blocking CSS
- impact: FCP/LCP 3.09 s at 150 ms RTT / 1.6 Mbps / 4× CPU (1.97 s with JS blocked); 670 KB, 100 requests.
- fix: in `hooks.server.ts` restrict `preload` on `(public)` routes to css/font/entry; drop Geist Mono preload on public pages; trim landing JS (items 30, 31); re-measure.
- command: optimize

**17. ECharts imported whole (326.5 KB gz)**
- where: `khepri/echarts.ts:26` (`await import('echarts')`), 14 hosts
- impact: ~640 KB gz JS on chart pages (ECharts + 70 KB layerchart + route JS).
- fix: `echarts/core` + `use([LineChart, BarChart, PieChart, HeatmapChart, GaugeChart, Grid, Tooltip, Legend, Calendar, VisualMap, Toolbox, CanvasRenderer])`; longer term one chart library.
- command: optimize

**18. body-map.glb 1.5 MB uncompressed, revalidated every use**
- where: `static/assets/models/body-map.glb`; `khepri/muscle-viewer.ts:24,475`
- impact: landing full-scroll 3.0 MB; no meshopt/Draco; `max-age=0`.
- fix: `gltfpack -cc` + `MeshoptDecoder`; long cache via `_headers` (item 24) with versioned filename.
- command: optimize

**19. Eyebrow over every landing section (absolute ban)**
- where: `landing/SectionHeading.svelte:9` (MonoLabel 10 px uppercase tracked) in all 11 sections; `Hero.svelte:45` motto `tracking-[0.32em]`; ~30 more MonoLabels incl. footer Privacy/Terms links at 10 px; app repeats it (MY DAY, DAILY LOOP)
- fix: drop the eyebrow from SectionHeading (Marcellus h2 opens each section); keep Waypoint distances (they carry the time axis); footer links normal-case 12–14 px.
- command: quieter

**20. PostHog off in production; full build when on**
- where: live HTML has `POSTHOG_API_KEY:""`; `analytics/Analytics.svelte:20-35`; `static/assets/js/vendor/posthog.min.js` (array.full.js, 614 KB raw / 161 KB br)
- impact: no analytics fire on kheprios.com — activation and outreach measurement have nothing to read. Turning it on as-is adds 161 KB br incl. rrweb to every page.
- fix: set the Worker's `POSTHOG_API_KEY`; ship `array.js`, lazy-load recorder only where `shouldRecord`; load after `requestIdleCallback`.
- command: harden

### P2

**21. Touch targets 28–36 px app-wide, no coarse-pointer rules** — `ui/button/button.svelte:20-28` (h-9/h-8/size-9/8/7; 171 `size="sm"`), `sidebar-menu-button.svelte:14` (h-8 rows), `ShellWidgets.svelte:51`, `CommandPalette.svelte:78`, `MessageRow.svelte:171`, `coach/Composer.svelte:83`, `crews/Composer.svelte:86`, `CrewSpace.svelte:577` (size-6), NudgeBell dismiss; rendered: settings "Edit" 21×16, "Manage" 44×16, switches 36×20, `/app/training/new` checkboxes 16×16, footer links 13–15 px. Fix: `pointer-coarse:min-h-11` / `pointer-coarse:size-11` in buttonVariants + sidebar button; checkbox+label as one 44 px row; remove per-file size overrides. → adapt

**22. Headings and landmarks** — `ui/card/card-title.svelte:13` fixed h3 (73 files; 12 routes jump h1→h3); no h1 on login, signup, forgot/reset, invites, oauth, onboarding(+done), chat/[id], lifts/today; `AuthShell.svelte` no `<main>`; `AppShell.svelte:112` `<main>` nested in `sidebar-inset.svelte:13` `<main>`; no skip link; sidebar not a `<nav>`; no `aria-current` (`AppShell.svelte:122-146`). Fix: Card.Title `level` prop (default 2); AuthShell `<main>` + h1; inner main → div; skip link to `#main`; `<nav aria-label>`; `aria-current="page"`. → harden

**23. Toggle/disclosure state not exposed** — `training/WeekSection.svelte:233` (no aria-pressed), `crews/MessageRow.svelte:149` (reaction chips), `training/ExerciseRow.svelte:74-80` (no aria-expanded; purpose only in title). → harden

**24. Accessible names hard-coded in English** — `ui/sidebar/sidebar-trigger.svelte:35`, `sidebar-rail.svelte:20`, `sidebar.svelte:50-51`, `ui/dialog/dialog-content.svelte:44`, `ui/sheet/sheet-content.svelte:55` ("Close"), `ui/input/input.svelte:61` (Show/Hide password; label flips while aria-pressed), `SearchSelect.svelte:97`, `ui/pagination/pagination.svelte:15`, `ui/breadcrumb/breadcrumb.svelte:17`, `CommandPalette.svelte:143`. Fix: i18n in primitives; static password-toggle label + aria-pressed. → harden

**25. Error states** — `src/routes/+error.svelte:16-21` English-only (es user saw "500 · Something went wrong / Internal Error"); signed-in 404 renders AuthShell (no sidebar); `/i/[code]` not-found generic (no "invite expired" + sign-up CTA); `/forgot-password` 404s when `GET /auth/options` fails. Fix: i18n keys; `(app)/app/+error.svelte` inside AppShell; invite-specific not-found; options fallback shouldn't hide password reset. → harden

**26. Language switcher submits on change** — `layout/LanguageSwitcher.svelte:24,27`: arrow-keying reloads on first keypress; options lack `lang`. Fix: explicit Go / Enter; `lang={tag}` per option. → harden

**27. Reduced motion missing in shared primitives** — `ui/sheet/sheet-content.svelte:39` (500 ms slide), `ui/dialog/dialog-content.svelte:32`, `coach/ThreadList.svelte:33`, `ui/skeleton/skeleton.svelte:15` (pulse), `formcheck/AnalysisStatus.svelte:32`, `ui/sonner/sonner.svelte:26` (spin). Fix: `motion-reduce:` variants or one global reduced-motion rule in app.css. → animate

**28. Body figure pointer-only** — `khepri/MuscleViewer.svelte:139-166` (selection via canvas/aria-hidden SVG), `bodymap.ts:130` (generic "Body figure" label), `training/ExerciseRow.svelte:172` (dialog shows only the figure). Fix: aria-label from primary/secondary muscle lists; keyboard list of regions under the figure calling `select()`. → harden

**29. Soreness buttons overflow in es/pt** — `day/BodyPanel.svelte:102-106` (`grid-cols-4` nowrap sm buttons; "Muito doloroso" needs 100–120 px in ~71–94 px cells). Fix: `grid-cols-2 sm:grid-cols-4`, wrapping, `h-auto`. → adapt

**30. My Day tab bar vs home indicator; nudge toast covers it** — `day/TabBar.svelte:17` (`fixed bottom-4`, no safe-area), `nudges/NudgeBell.svelte:120` (hand-rolled toast `fixed bottom-4 z-50`). Fix: `bottom-[max(1rem,env(safe-area-inset-bottom))]`; route nudges through Sonner, top-center on mobile. → adapt

**31. Period segmented control hand-rolled 4×** — `overview/+page.svelte:60-75`, `insights/InsightsPage.svelte:55-72`, `recaps/RecapPanels.svelte:65`, `insights/timeline/TimelinePanels.svelte:58` (28 px targets, no focus-visible). Fix: one `RangeTabs` on ui/toggle-group. → distill

**32. Primary button re-declared at ~47–60 call sites** — `class="bg-signal text-background hover:bg-signal/90"` across `settings/*Card.svelte`, `care/*`, `overview/TodayCard.svelte:40`, `knowledge/Library.svelte:114`, auth pages, `Navbar.svelte:35,38`; duplicates `variant="default"` with a different foreground; hover fails contrast (item 11). Fix: codemod the overrides away; let the variant own it. → distill

**33. Landing identical icon card grids** — `landing/ClosingSections.svelte:59-73` ("What you get" ×5) and My Day ×3. Fix: cut (demos already make the case) or a plain two-column definition list. → distill

**34. Stat-tile template on landing and 9 insights pages** — `landing/StatsDemo.svelte:56-63`, `ClosingSections.svelte:106-111` (3 gold big-number cards), `insights/StatTile.svelte` opening Progress/Training/Lifting/Body/Coach/Spend/Mind/Nutrition (+ StatsTiles in Sleep/Cardio), `coach/CoachKpiStrip.svelte:14`. Fix: sentence-style summary with the "why", or one key/value row; vary the lead element per page (chart-first on sleep/cardio). → distill

**35. Landing hero + closing CTA are the stock template** — `landing/Hero.svelte:30-79` (9 stacked elements, 3 CTA rows, dot-and-arrow pill, h1 renders `text-wrap: wrap`), `ClosingSections.svelte:166-190` (icon circle + centred h2 + 2 buttons + badges). Fix: one CTA row (web CTA + "See it"), badges to the iPhone section, remove the pill and the compass circle, `text-balance` on h1. → quieter

**36. ECharts tooltips stay white in dark mode** — `viz/echarts.ts:76,127,186`, `memories/view.ts:91`, `training/plan.ts:95`. Fix: tokenised tooltip defaults merged once in `mountChart`. → polish

**37. `/assets/*` served `max-age=0`** — no `static/_headers`; fonts, models, art, posters revalidate every load; with `font-display: optional` a slow revalidate means the font never applies. Fix: `static/_headers` — fonts/models `max-age=31536000, immutable` (versioned names), `/assets/*` `max-age=86400, stale-while-revalidate=604800`. → optimize

**38. i18n catalogs: whole app per page, en always fetched, not preloaded** — `i18n/catalog.ts:15`, `routes/+layout.ts:7-9`; 4,008 keys (58–63 KB gz each), landing uses 393; es/pt users also fetch en (~120 KB combined) though CI enforces parity. Fix: drop en fallback fetch; split `land.*` from app sections; modulepreload the locale chunk. → optimize

**39. App home routes 370–380 KB gz static JS** — `/app` (370), `/app/overview` (379); layerchart via `overview/MoodEnergyChart.svelte:9`, `HydrationChart.svelte:7`; markdown-it static via `khepri/markdown.ts:10`. Fix: lazy charts behind IntersectionObserver (as MuscleDemo); markdown on demand or server-rendered. → optimize

**40. Exercise art loops forever** — `khepri/ExerciseArt.svelte:24-42`, `training/DayCard.svelte:104-116`: 5×6 plan = 30 `setInterval`s at 900 ms (never pause offscreen/hidden) + 90 mask SVG requests (~1 MB); 906 unminified frames, 25.9 MB on disk. Fix: run only when intersecting + visible (or CSS `steps()`), lazy frames 2–3, svgo the set. → optimize

**41. Muscle viewer renders 60 fps idle; re-fetches the model on every scroll-in** — `khepri/muscle-viewer.ts:339-352,475`, `MuscleViewer.svelte:109-120`. Fix: render on demand (sway/drag/ease/setHeat/setTheme/resize), no idle loop under reduced motion; cache parsed GLTF at module level and clone. → optimize

**42. App layout load re-runs every navigation** — `routes/(app)/app/+layout.server.ts:12-25` reads `url` → `GET /first-week` on every `__data.json`. Fix: `untrack()` URL reads, cache `simpleNav` per session or move redirect to hooks; `depends('north:first-week')`. → optimize

**43. Chat transcript unpaginated; each turn refetches everything** — `coach/chat.svelte.ts:136` (`invalidate('north:chat')`), `chat/[id]/+page.server.ts:9-13`, `ChatPage.svelte:144`; `GET /conversations/{id}` has no paging. Fix: `before`/`limit` on the API, render last ~50 with "load earlier", append reply locally after a turn. (Needs north-client API change.) → optimize

### P3

**44. Decorative backdrop-blur on near-opaque surfaces** — `day/TabBar.svelte:18`, `khepri/MuscleViewer.svelte:179`, `checkins/CheckInWizard.svelte:78` (90–95 % opacity). Keep `Navbar.svelte:18`. → quieter

**45. Minor bans** — `rounded-[24px]` on chat bubbles `coach/classes.ts:26,28`; `ui/dropdown-menu/dropdown-menu-sub-content.svelte:29` `z-[9999]` (no z scale; paints over dialogs/toasts); `AppShell.svelte:135` 2 px gold side rule on active nav; `landing/BearingRail.svelte:13-33` animates height/width per scroll event and reads scrollHeight each time. Fix: rounded-2xl; z-50 + `--z-*` tokens; active state via tint + bg; transform scale + rAF. → polish

**46. Landing mobile first screen rough edges** — hero wall clips its own card copy at 375 px ("Half mara", "day str"); "Free… No card." check icon detached from centred text (`Hero.svelte`); App Store / Google Play badges English in pt-PT and es. → polish

**47. No success/warning tokens** — `fitness/hub.ts:198` → `fitness/+page.svelte:441` emerald-500 2.33:1 light; `ui/progress/progress.svelte:33,35`, `ui/rating/rating-item.svelte:31` green/yellow palette classes. Fix: add `--success`/`--warning` (new names, no renames) tuned ≥4.5:1 both themes. → colorize

**48. Overview polls every 20 s in background tabs** — `khepri/live.ts:22-29`, `overview/+page.svelte:33-38`. Fix: skip when `document.hidden`, refresh on `visibilitychange`. → optimize

**49. Token and CSS hygiene** — `app.css:173,176,181,190` / `266-276` gold literals ×4 each, `:313` muse bubble repeats `--secondary`; dead `[x-cloak]` (`:334`) and `data-tui-*` (`:355-359`) rules; stale templ/Alpine/Go comments (`:71,330-333,464-467,588-592,695`, missing `_reviews/muse-chat-contract.md`); `day/Rail.svelte:72` overrides theme `--card` locally (rename to `--rail-tint`); container widths drift max-w-2xl…7xl; `3xl`/`4xl` breakpoints unused; 104 `text-[9|10|11px]` uses across 50 `/app` files (mono uppercase micro-labels). → document (DESIGN.md) + polish

## Systemic patterns

- **Primitives get patched at call sites instead of at the source**: Dialog height (2 vh patches), primary button (~47–60 restyles), segmented range (4 copies), nudge toast (hand-rolled beside Sonner), 3 FieldMessage copies, error colour (red-500 ×26). Fixing ~8 primitives clears most of the list.
- **Touch is second-class**: zero `pointer-coarse` / `(hover:none)` rules; hover-only reveals; 28–36 px controls.
- **Light mode inherited the dark palette**: every contrast failure is light-only (except switch track and two rail labels). Light tracker steps sit at L 0.55–0.8. `scripts/brand/contrast.mjs` checks only opaque base pairs, so it reports all-pass while alpha composites (`/50` ring, `/70` text, `/90` hover) fail.
- **State lives in styling, not ARIA**: data-active, variant, translate-x instead of aria-current, aria-pressed, aria-expanded, inert.
- **Heavy features lazy-loaded, their assets not optimised**: uncompressed glb, 25.9 MB of unminified SVG frames, full ECharts, full PostHog, no cache headers outside `/_app/immutable/`.
- **Always-running loops** ignore visibility/reduced motion (exercise flipbooks, viewer idle render, overview poll).

## Positive findings

- Zero horizontal overflow across 89 renders (after the 320 px navbar), including pt-PT/es; no reveal-gated content; no console errors or broken images.
- Theme resolved server-side with no flash; both themes fully tokenised; ECharts and three.js re-read tokens on theme change; old-brand literals (#644DC6, cyan) gone from code.
- Core pairs pass with margin: foreground 15.7/16.9:1, muted 5.35/8.54:1, antique gold text 4.95:1 on ivory, input edge 3.47/3.11:1, placeholder 5.6:1.
- Reduced motion honoured on all brand motion (hero wall, mascot, coin, thread-in, demos, three.js viewer).
- Icon buttons almost all have translated aria-labels; command palette is a correct combobox; check-in ScalePicker uses real radios in a fieldset; auth forms have correct autocomplete and `role="alert"`.
- `<html lang>` per request and updated live; safe-area insets on header and composers; 44 px chat/check-in targets.
- three.js and ECharts dynamically imported with proper disposal; immutable caching on `/_app/immutable/*`; service worker avoids HTML/SSE and retires per build; CLS 0.
- `/app` passes the product slop test: no Marcellus in UI, consistent 24 px Geist h1s, no clamp headings, no gradient text, no bounce, no nested cards, teaching empty states.

## Recommended order

1. **P1 `harden`** — primitives first (Slider/SearchSelect labels, FieldMessage + aria-describedby, focus ring, tabs-content, Dialog max-h, sidebar names/More trigger), then coach composer + live regions, chart text alternatives, heatmap colour bug, PostHog key.
2. **P1 `layout`** — coach chat shell (`wide: true`, short-viewport header).
3. **P1 `colorize`** — light-mode text steps for trackers, destructive, signal hover; Activity units; success/warning tokens (47).
4. **P1 `optimize`** — landing preloads, echarts/core, glb meshopt, `_headers`; then P2 perf (38–43, 48).
5. **P1–P2 `adapt`** — navbar 320, touch targets, hover-only actions, soreness grid, tab bar safe area.
6. **P1–P2 `quieter` + `distill`** — landing eyebrows, hero/closing CTA, card grid, stat tiles, primary-button codemod, RangeTabs.
7. **P1–P2 `animate`** — film pause + reduced motion, primitive motion-reduce.
8. **`document`** — DESIGN.md from the tokens (unblocks future variant work), then **`polish`** as the final pass.
