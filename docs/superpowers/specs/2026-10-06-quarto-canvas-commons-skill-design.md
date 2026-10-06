# Quarto Canvas Commons skill: design spec

## Overview

- **Situation**: Andrie builds code-based animations with Motion Canvas (a TypeScript
  animation library) and embeds them in Quarto revealjs presentations. Across three
  conference projects (`PMDS`, `goes-paddling`, `conf-2025-working-with-infosec`), this
  workflow has matured into four working Claude Code skills, a shared build/embed
  mechanism, and a hand-curated API reference, but all four skills are trapped inside one
  project's `.claude/skills/` folder and invisible everywhere else.
- **Complication**: creating a new animation is still slow. The library has a large
  surface area, so picking the right node or method takes trial and error even with the
  existing skills. The underlying library itself has also changed: Motion Canvas's
  upstream repository has been dormant since February 2025, and development has moved to
  Canvas Commons, an active community fork using renamed `@canvas-commons/*` packages
  with no other breaking API changes. A separate experiment to solve the discovery
  problem via an MCP server was abandoned after proving unreliable (stdio connection
  drops, a whole workaround document just to keep the process alive) before it grew
  beyond a docs-search and component-hierarchy tool.
- **Question**: how should this body of work be promoted, consolidated, and extended so
  that starting a new Motion-Canvas-in-Quarto presentation (the Positron features talk is
  the first real test case) is fast, targets the maintained library, and fits cleanly
  into Andrie's existing slide-authoring skills rather than duplicating them?
- **Answer**: promote the four existing skills to global (`~/.claude/skills/`), port them
  from Motion Canvas to Canvas Commons as part of the move, extract the shared
  component/style library the three projects currently copy-paste, replace the abandoned
  MCP server's docs/search tools with offline generation scripts bundled into the
  `motion-canvas-api` skill, add small scene-lifecycle scripts to remove a known class of
  manual error, add a new `motion-canvas-r-code` skill for the R-syntax-highlighting and
  font-loading knowledge that took disproportionate effort to work out the first time,
  seed the project with worked examples (hand-built scenes and SVG-to-animation pairs),
  and add one cross-reference from the existing `quarto-presentation` skill so "this
  slide needs an animation" hands off cleanly to the animation skills. No new
  storyboarding or ideation skill: `quarto-presentation`, `narrative.md`, and
  `writing-voice` already own slide structure, pacing, and prose, down to the explicit
  guidance to reach for an animation only for "one genuinely illustrative" slide.

## Background: what already exists

### Five project-scoped skills (in `conf-2025-working-with-infosec/.claude/skills/`), four of which this project promotes

| Skill | Owns |
|---|---|
| `motion-canvas-api` | Library API reference: nodes, signals, tweening, layout, Code component, filters, transitions, gotchas |
| `motion-canvas-scene` | Creating/building/debugging scenes: file structure, vite registration, build commands, error tables |
| `motion-canvas-authoring` | Composition patterns: diagram scenes, grid/pattern scenes, geometric scenes, code-display scenes, custom components |
| `svg-to-motion-canvas` | The draw.io-SVG-to-animated-scene translation workflow: element mapping, coordinate scaling, style translation, animation strategy |
| `quarto-presentation` (project-scoped copy) | Shortcode syntax, slide conventions, extension internals, troubleshooting — now **superseded** by a more mature global copy, see below. Not promoted: the global copy already supersedes it (see "Scope of this project" for the promotion count of four). |

These are well-written and already encode real debugging history (the Polygon
inscribed-ellipse gotcha, the reveal.js frame-polling race condition, the
`Colors.TEXT`/transparent-fill gotchas). They are the asset to promote, not rewrite from
scratch.

### A global `quarto-presentation` skill (already in `~/.claude/skills/`, WSL)

A more mature, general-purpose version of the slide-authoring skill already exists
globally, decoupled from Motion Canvas specifics. It routes between brand profiles, loads
a shared layout grammar, and defers all prose rules to `writing-voice` (pyramid
principle/SCQA, UK English, one-person voice). Its `references/narrative.md` already
states "one idea per slide" and deck pacing; `references/extensions.md` already documents
the `andrie/motion-canvas` Quarto extension, including its two easy-to-get-wrong YAML
requirements, and says to reach for it for "one genuinely illustrative animation, not
decoration on every slide."

This skill is the front door for "I want to build a talk." It is **not** being redesigned
by this project. The only change it needs is a small addition described below.

### An abandoned MCP server (`mcp-node-motion-canvas`, recovered from WSL crash backup)

Built to expose `search_api` (fuzzy/synonym search across Motion Canvas TypeScript
source, docs, and examples) and `component_hierarchy` (inheritance tree with JSDoc
descriptions extracted from class definitions) as live MCP tools over stdio. Never
finished — only those two tools shipped; a planned HTTP transport and additional
scene-management tools were never built. Abandoned because the stdio connection was
unreliable enough to need its own troubleshooting document
(`conf-2025-working-with-infosec/MCP-STATELESS.md`). Decision made during brainstorming:
an MCP server is the wrong shape for this problem — the underlying data (API surface,
component hierarchy) only changes when the library version changes, so it does not need
a live process. The generation **logic** in `src/tools/` and `src/utils/` is worth
porting into one-off scripts; the server framing is not.

### The custom Quarto Lua extension behind the `motion-canvas` shortcode

Each project vendors its own copy of `_extensions/andrie/motion-canvas/` (three files:
`_extension.yml`, `motion-canvas.lua`, `motion-canvas-player.js`), and the copies have
diverged. Direct diffs across all four locations (WSL infosec, Windows infosec, PMDS,
goes-paddling) confirm the **WSL copy of `conf-2025-working-with-infosec` is the newest
and most correct**:
- Its `motion-canvas.lua` emits `loop="false"` as a real HTML attribute only when
  explicitly set, where the older copies (Windows infosec, PMDS, goes-paddling — all
  identical to each other) have a subtly different, less correct attribute-emission path.
- Its `motion-canvas-player.js` has a frame-tracking fix for the stop-at-end-frame race
  condition (tracks the maximum frame seen before checking for completion, avoiding a
  false "done" trigger from the frame counter wrapping) plus a `DEBUG_ENABLED` gate for
  its console logging. The older copies lack both.
- PMDS additionally has a stale, pre-namespace copy at `_extensions/motion-canvas/`
  (missing the `andrie/` owner prefix), confirming it predates the other three.

This matches what the global `quarto-presentation` skill's `references/extensions.md`
already documents in prose (the two easy-to-get-wrong YAML requirements, the frame-
polling behaviour) — that skill's description was written from this WSL copy. This
project does not change `quarto-presentation`'s documentation of the extension further;
it only needs to know that **the WSL `conf-2025-working-with-infosec` copy is the
canonical source** if the extension itself is ever copied into a new project or updated,
rather than treating any of the other three copies as equally current.

### The two-project build architecture

Neither the project-scoped skills nor the global `quarto-presentation` skill currently
documents the full picture of how a presentation project is actually put together — only
the shortcode/embedding side. Direct inspection of the WSL `conf-2025-working-with-infosec`
project (the newest, used as the reference) shows **two separate Vite/npm projects living
in one repo**, not one:

1. **The root project** (`package.json` at the project root, its own `vite.config.ts`).
   Its only job is bundling the Motion Canvas **player runtime** — the library that knows
   how to load and play a compiled scene — from a near-empty entry shell,
   `motion-canvas-ts.html` (just `<script type="module" src="/src/main.ts">`, not a page
   anyone visits). It builds to `dist/motion-canvas-ts.js`, which is the exact file the
   qmd's `include-in-header` script tag loads.
2. **The `animations/` project** (its own `package.json`, its own `vite.config.ts`, using
   the `@motion-canvas/vite-plugin`). Its job is compiling each individual **scene**
   (`src/<scene>.ts` project files, registered in the `project:` array the
   `motion-canvas-scene` skill already documents editing) to `../dist/animations/<scene>.js`.

Both outputs land under one `dist/` folder, which is what the qmd's
`resources: [dist/*/*, _fonts/*/*]` ships into the rendered Quarto output, and what the
shortcode's `src=` paths resolve against at render time. The `Makefile` is the orchestrator
tying this together: `make anim` runs `npm run build` (root, player) and
`npm --prefix ./animations run build` (scenes) using file-timestamp markers
(`dist/.build-complete`, `dist/animations/.build-complete`) to skip unchanged halves,
then `make quarto`/`make preview`/`make publish` render.

**A real quirk worth documenting, not silently fixing**: the root project's dependencies
include `@motion-canvas/core`, `@motion-canvas/player`, and `lezer-r` — the same
`lezer-r` an earlier research pass on this project found "missing" from
`animations/package.json`. It isn't missing: it is installed at the **wrong level** (the
player-runtime project, not the scene-compiling project that actually imports and uses
it in `shiny-ellmer.tsx`). This apparently still works today, which suggests Vite's
dependency resolution is tolerant of this, but it is fragile and worth correcting
when this project ports the skill content, rather than reproducing the same misplaced
dependency in a freshly promoted skill.

**No scaffold or bootstrap tooling exists today.** Starting a new presentation project
means manually copying an existing project's root files
(`package.json`, `vite.config.ts`, `motion-canvas-ts.html`, `Makefile`, `_extensions/`)
and reinstalling dependencies by hand; `make install` only reinstalls `animations/`'s
dependencies, not the root project's. A stale `README.qmd` left over from an earlier
`goes-paddling`-derived copy is the closest thing to existing bootstrap documentation.

### Three conference projects surveyed

| Project | Canvas Commons migration status | Notable content |
|---|---|---|
| `PMDS/animations` | Motion Canvas 3.13.0 | R/Python interop scenes; generic branding scenes |
| `goes-paddling/animations` | Motion Canvas 3.13.0 | Hand-built vector-path character animation (`kayak.tsx`) |
| `conf-2025-working-with-infosec/animations` (WSL copy is newest) | Motion Canvas 3.17.2 | Three SVG-derived scenes with a `.claude/skills/svg-to-motion-canvas` doc describing exactly how they were built |

No shared library exists today: all three vendor independent copies of `styles.ts`, the
branding scenes, and (where present) custom components. Direct diffs (not just filename
matching) show the duplication is less clean than it first looked:
- `posit_footer.tsx` and `quarto_mc.tsx` are genuinely identical between PMDS and
  goes-paddling (the only true byte-for-byte duplicates); `quarto_mc.tsx` does not exist
  in the infosec project.
- `hexagons.tsx` and `posit_logo.tsx` diverge meaningfully across all three. PMDS has the
  most refined version of each (uses the `Posit`/`Colors` style constants, a
  `createRefMap`, per-element fade/highlight sequencing). The infosec copy of `hexagons`
  is an older, simpler variant with hardcoded colours. goes-paddling's `posit_logo.tsx`
  is not a generic logo bumper at all — it was customised into a talk-specific "Posit
  goes Paddling" title animation (chevrons morph into a boat, animated title text,
  `waitUntil` timed events), so it is a second worked example, not a duplicate to
  deduplicate away.
- `pipeline.tsx` exists only in PMDS and goes-paddling (absent from infosec) and the two
  copies also diverge: PMDS's is a later revision using `view.size()` instead of
  hardcoded canvas dimensions, plus reusable `ConnectingLine`/`TxtRect`/`Clock` helper
  components that goes-paddling's copy lacks.

Treat PMDS as the source for the shared library's versions of `hexagons`, `posit_footer`,
`quarto_mc`, `pipeline`, and `styles.ts` — it consistently has the more refined revision
where the three projects differ.

### The Posit colour palette

Defined identically as `Posit` and (almost identically) as `Colors` in `styles.ts` in all
three projects. One confirmed drift: `Colors.TEXT` is `#ACB3BF` in PMDS and the Windows
copy of infosec, but `#447099` in the WSL copy of infosec — and the WSL copy's own
`.claude/motion-canvas.md` still documents `#ACB3BF` in prose, so the hex value drifted
after the doc was written. Canonicalise on `#ACB3BF` when extracting the shared palette,
and treat the WSL copy's `#447099` as the bug to fix.

## Scope of this project

### In scope

1. Promote the four existing skills to `~/.claude/skills/`, each kept as a distinct skill
   with its existing trigger conditions.
2. Port all Motion-Canvas-specific content in those four skills to Canvas Commons:
   package names (`@motion-canvas/*` → `@canvas-commons/*`), any import paths that
   changed, and references to the dormant upstream repo/docs. The animation API itself
   (nodes, signals, tweening, layout) carries over unchanged — this is confirmed to be a
   rename-level fork, not a rewrite, so treat this as a mechanical pass, not a
   re-derivation of API knowledge.
3. Extract a shared component/style library from the three projects' duplicated code
   (see "Shared library" below) so new projects depend on one source instead of
   copy-pasting.
4. Reconcile the `Colors.TEXT` drift as part of extracting the shared palette.
5. Port the abandoned MCP server's search and hierarchy-generation logic into offline
   scripts bundled with the `motion-canvas-api` skill, and use them to generate the first
   version of the Canvas Commons API reference data (see "Reference generation" below).
6. Add scene-lifecycle scripts (`add-scene`, `remove-scene`) that edit `vite.config.ts`'s
   project array programmatically, replacing the manual edit step `motion-canvas-scene`
   currently documents by hand.
7. Add a new `motion-canvas-r-code` skill covering R syntax highlighting in the `Code`
   component — the custom `RHighlighter`, the `lezer-r` parser setup and its TypeScript
   shim, and the font requirements — as its own skill rather than a subsection of
   `motion-canvas-authoring`, reflecting how much iteration this took to get right (see
   "R code animation" below).
8. Seed the new project with a deduplicated set of hand-built scenes from the three
   surveyed conference projects, and with the draw.io-sourced SVG diagrams that have a
   matching animated scene, as worked examples for the promoted skills to point at (see
   "Seed content" below).
9. Document the custom Quarto Lua extension that implements the `motion-canvas`
   shortcode (`_extensions/andrie/motion-canvas/`) as part of `quarto-presentation`'s
   existing knowledge, pointing at the WSL `conf-2025-working-with-infosec` copy as the
   current, most-correct version (see "Quarto extension provenance" below).
10. Document the two-project build architecture (root player-runtime project +
    `animations/` scene-compiling project, merged into one `dist/` folder) and add a
    bootstrap checklist for starting a brand-new presentation project from scratch, since
    neither exists as a single reference today (see "Project architecture and bootstrap"
    below).
11. Add one short cross-reference from `quarto-presentation`'s `extensions.md` pointing
    from "this slide needs an animation" to the promoted animation skills, closing the
    seam between slide planning and animation authoring. Separately, add a new reference
    file documenting the `motion-canvas` shortcode's actual option mechanics
    (`fullscreen`/`width` mutual exclusivity, what `background` and `loop`/`auto` really
    do) and the `.hidetitle` convention for slides whose entire content is the animation,
    confirmed against real usage across all four surveyed `.qmd` files, not just the
    option names already listed (see "Cross-reference from `quarto-presentation`, and the
    shortcode-semantics gap" below).
12. Use the Positron-features talk as the first real exercise of the promoted/ported
    skills, to validate the design against real use before calling it done.

### Out of scope

- A new storyboarding, ideation, or slide-planning skill. `quarto-presentation` +
  `narrative.md` + `writing-voice` already own this; duplicating it was considered during
  brainstorming and explicitly rejected.
- Rewriting or redesigning `quarto-presentation` itself beyond the one small
  cross-reference addition.
- Publishing the shared component library as a public/versioned npm package. A local,
  relatively-referenced (or small workspace) folder is sufficient; there is no external
  consumer.
- Migrating the Motion Canvas *editor*/UI tooling — this project only concerns the
  animation-authoring and embedding workflow, not the interactive editor.
- Building any new live-server/MCP tooling. This was tried and explicitly rejected in
  favour of skills plus offline scripts.

## Design

### 1. Skill promotion and layout

Target layout under `~/.claude/skills/` (WSL), one folder per skill, matching the
existing `quarto-presentation` skill's internal convention of `SKILL.md` +
`references/*.md` + `assets/*`:

```
~/.claude/skills/
  motion-canvas-api/
    SKILL.md
    references/
      api-reference.md       # ported from the hand-written motion-canvas.md
      component-hierarchy.md # generated, see Reference generation
      api-search-index.json  # generated, see Reference generation
    scripts/
      generate-api-search.js      # ported from mcp-node-motion-canvas/scripts/api-search.js
      generate-component-hierarchy.js  # ported from .../scripts/component-hierarchy.js
  motion-canvas-scene/
    SKILL.md
    scripts/
      add-scene.js
      remove-scene.js
  motion-canvas-authoring/
    SKILL.md
  svg-to-motion-canvas/
    SKILL.md
    references/
      worked-examples.md   # the three SVG-to-scene pairs, see Seed content
  motion-canvas-r-code/     # new, see R code animation below
    SKILL.md
    components/
      RHighlighter.ts
    references/
      fonts-and-highlighting.md
    scripts/
      (TBD pending font/Lezer research findings)
  canvas-commons-library/        # the shared component/style package, see below
    styles.ts
    components/
      Database.tsx
    scenes/
      hexagons.tsx              # source: PMDS (most refined revision)
      posit_footer.tsx          # byte-identical in PMDS/goes-paddling
      quarto_mc.tsx              # byte-identical in PMDS/goes-paddling; absent from infosec
      pipeline.tsx              # source: PMDS (later revision; view.size(), helper components)
    utils/
      pulse.ts
  seed/                         # worked examples, not shared library code — see Seed content
    scenes/
      posit_logo-pmds.tsx
      posit_logo-paddling-boat.tsx
      kayak.tsx
      one23.tsx
      infosec-triad.tsx          # matches diagrams/infosec_triad.drawio.svg
      multi-database.tsx         # matches diagrams/multiple_sources.drawio.svg
      shiny-ellmer.tsx           # matches diagrams/llm_app.drawio.svg; also the R-code worked example
    diagrams/
      infosec_triad.drawio.svg
      multiple_sources.drawio.svg
      llm_app.drawio.svg
    lib/                         # staging copies for the shared library in section 4,
                                  # sourced per the Background findings (mostly PMDS)
      styles/styles.ts
      components/Database.tsx
      scenes/hexagons.tsx
      scenes/pipeline.tsx
      scenes/posit_footer.tsx
      scenes/quarto_mc.tsx
    r-code/                      # staging copies for motion-canvas-r-code, section 7
      RHighlighter.ts
      lezer-r.d.ts
      global.css                # the actual font-loading fix, see Problem 1 below
      shiny-ellmer-code.R
```

The `seed/lib/` and `seed/r-code/` staging copies already exist on disk at the paths
above (copied from PMDS and the WSL `conf-2025-working-with-infosec` project
respectively) and are the source for the final `canvas-commons-library/` and
`motion-canvas-r-code/` skill layouts described in sections 4 and 7 — implementation
should move/adapt them into place rather than re-copying from the original conference
projects a second time.

`quarto-presentation` (already global) is not moved or restructured; it gains one
cross-reference (see section 10) and a documented pointer to the canonical copy of the
`andrie/motion-canvas` Lua extension (see "Quarto extension provenance" below).

Each promoted `SKILL.md` keeps its existing `name`/`description`/trigger frontmatter, with
two additions applied uniformly:
- A short "project conventions" note at the top, making explicit that the skill assumes
  the `animations/src/`, `vite.config.ts`, `make anim` conventions seen in these three
  projects — so a future project that structures things differently is a visible
  deviation, not a silent assumption.
- Package names and import paths updated to `@canvas-commons/*`.

### 2. Project architecture and bootstrap

Add one reference file, `motion-canvas-scene/references/project-architecture.md` (the
natural home, since this skill already owns build commands and file structure), covering
two things together — they are the same material read from different angles:

**The architecture diagram**, in prose, based on direct inspection of the WSL
`conf-2025-working-with-infosec` project (see Background):
- The root project (`package.json`, `vite.config.ts`, `motion-canvas-ts.html`) bundles
  the Motion Canvas **player runtime** to `dist/motion-canvas-ts.js` — the file the qmd's
  `include-in-header` script tag loads. `motion-canvas-ts.html` is a near-empty Vite
  entry shell, not a page anyone opens directly.
- The `animations/` project (its own `package.json`, `vite.config.ts` using
  `@motion-canvas/vite-plugin`) compiles each registered scene to
  `../dist/animations/<scene>.js`.
- Both land under one `dist/` folder, shipped into the rendered Quarto output via
  `resources: [dist/*/*, _fonts/*/*]` in the qmd's YAML header, and referenced by the
  shortcode's `src=` paths at render time.
- The `Makefile` orchestrates both halves: `make anim` builds root + `animations/` (using
  file-timestamp markers to skip unchanged halves), `make quarto`/`make preview`/
  `make publish` render. `make force-build` ignores the timestamp markers.
- A documented quirk: `lezer-r` lives in the **root** project's dependencies in the
  reference project, not in `animations/` where it is actually imported and used. Note
  this explicitly as something to fix (install it in `animations/package.json` instead)
  when bootstrapping a new project, not something to copy forward.

**The bootstrap checklist**, for starting a brand-new presentation project from scratch
(no scaffold script — see the brainstorming decision below — just a documented sequence
for Claude to follow by hand each time):
1. Copy the root-level files from the canonical WSL `conf-2025-working-with-infosec`
   project: `package.json`, `vite.config.ts`, `motion-canvas-ts.html`, `Makefile`,
   `_extensions/andrie/` (per the Quarto extension provenance note above — this is also
   the canonical copy of `_extensions/andrie/motion-canvas/`).
2. Copy `animations/` as a skeleton: `package.json`, `vite.config.ts`, `styles.ts` (from
   the shared library, section 4, rather than copying a project's own stale version),
   `motion-canvas.d.ts`, an empty `scenes/` folder, and `public/_fonts/`.
3. Run `npm install` in the project root, then `npm --prefix ./animations install`,
   since these are two independent dependency trees, not one.
4. Create the presentation's own `.qmd` with the standard YAML header (per
   `quarto-presentation`'s `references/extensions.md`): the `resources:` and
   `include-in-header:` entries for motion-canvas, plus whichever of `gongtimer`/
   `reveal-auto-agenda`/`appearance` the talk needs.
5. Use `motion-canvas-scene`'s `add-scene.js` (section 6) for the first real scene, then
   `make anim` to validate the whole pipeline builds end to end before writing further
   content.

This checklist is deliberately a documented sequence, not a new scaffold script — a
script was considered and explicitly deferred during brainstorming, since a checklist is
enough to make this reliable without taking on a new piece of tooling to maintain.

### 3. Canvas Commons port

A mechanical pass over the content of the four pre-existing Motion-Canvas-specific
skills (`motion-canvas-api`, `motion-canvas-scene`, `motion-canvas-authoring`,
`svg-to-motion-canvas` — not `quarto-presentation`, which is general-purpose, and not the
new `motion-canvas-r-code`, which is written fresh against Canvas Commons from the
start): replace `@motion-canvas/core`, `@motion-canvas/2d`, `@motion-canvas/ui`,
`@motion-canvas/vite-plugin`, `@motion-canvas/ffmpeg`, `@motion-canvas/player` with their
`@canvas-commons/*` equivalents in every code sample, import statement, and prose
reference. Cross-check each renamed package actually exists under the new scope
(confirmed so far: `core`, `2d`). Update the one reference to the motion-canvas
GitHub/docs URLs to point at `canvas-commons.github.io` instead.

Do not change any API usage patterns (signals, tweening, `Layout`, `Polygon.vertex()`,
`Code` component, cardinal points) — these were confirmed unchanged between the two
package trees.

### 4. Shared component/style library

A plain folder (not a published npm package), referenced by relative path from each
presentation project's `animations/src/`, containing:
- `styles.ts`: the reconciled `Posit` and `Colors` constants (canonical
  `Colors.TEXT = '#ACB3BF'`), `BaseFont`, `WhiteLabel`/`BlackLabel` presets. Source from
  PMDS's copy, which carries the `Posit`/`Colors`-constant-based revision.
- `components/Database.tsx`: the one custom component confirmed reused as-is across
  scenes. (`RHighlighter.ts` moves to the new `motion-canvas-r-code` skill instead — see
  below — since it is R-specific knowledge, not a generic shared component.)
- `utils/pulse.ts`: the scale-up/scale-down emphasis animation utility.
- `scenes/hexagons.tsx`, `scenes/pipeline.tsx`: source from PMDS specifically, which has
  the more refined revision of both (confirmed by direct diff, not just filename
  matching — see Background). Do not source these from goes-paddling or infosec, whose
  copies are older or simpler variants.
- `scenes/posit_footer.tsx`, `scenes/quarto_mc.tsx`: confirmed genuinely byte-identical
  between PMDS and goes-paddling by direct diff; either source works. `quarto_mc.tsx` is
  absent from the infosec project.
- `posit_logo.tsx` is deliberately **not** included here: PMDS's and goes-paddling's
  copies diverge too much to treat as one shared scene (goes-paddling's is a bespoke
  talk-specific title animation, not a generic bumper). Both are preserved instead as
  separate seed examples — see "Seed content" below.

`motion-canvas-scene`'s "create a new scene" instructions gain one step: check this
shared library for an existing component or scene before writing a new one from scratch.

### 5. Reference generation (replacing the MCP server's role)

Port, not rewrite, the two working tools from `mcp-node-motion-canvas`:
- `src/tools/simplified-api-search.ts` + its supporting utils
  (`DocsProcessor.ts`, `ContentCollector.ts`, `SimpleSearch.ts`, `search-utils.ts`) become
  `generate-api-search.js`, a standalone Node script that walks a local Canvas Commons
  checkout (TypeScript source, `.d.ts` files, docs, examples) and writes a static search
  index (`references/api-search-index.json`) plus a human-readable summary.
- `src/tools/component-hierarchy.ts` + `ComponentHierarchyLoader.ts`/`hierarchy-utils.ts`
  become `generate-component-hierarchy.js`, producing `references/component-hierarchy.md`
  (ASCII tree, matching the original tool's default output format) from the Canvas
  Commons `2d`/`core` package source.

Both scripts require a local clone of `canvas-commons/canvas-commons` to run against
(the original project's README documents building its docs via `npx lerna run build` —
confirm the equivalent commands still work against the fork before relying on them).
Run once to produce the first version of these reference files, commit them, and re-run
only when Canvas Commons ships a version bump that plausibly changes the API surface —
not on every skill invocation. The `motion-canvas-api` skill reads the generated files as
static reference material alongside the hand-curated `api-reference.md`
(ported from the existing `.claude/motion-canvas.md`), not as a live lookup.

### 6. Scene-lifecycle scripts

Two small Node scripts added to `motion-canvas-scene`:
- `add-scene.js <name>`: creates `animations/src/scenes/<name>.tsx` (skeleton scene) and
  `animations/src/<name>.ts` (project file), then parses and edits `vite.config.ts`'s
  `project` array to append the new entry, rather than relying on a hand-edit.
- `remove-scene.js <name>`: deletes both files and removes the corresponding entry from
  `vite.config.ts`'s `project` array.

These directly remove two of the error cases `motion-canvas-scene`'s own troubleshooting
table already lists (`Cannot find module './scenes/<name>?scene'`,
`Could not resolve './src/<name>.ts'`), both caused by the registration step going wrong
by hand. The skill's existing four-step "creating a new scene" walkthrough is replaced by
one script invocation plus the `make anim` validation step it already documents.

### 7. R code animation: a dedicated skill

Getting R syntax highlighting working correctly inside the `Code` component took
disproportionate effort in `conf-2025-working-with-infosec` (the `shiny-ellmer.tsx`
scene) — enough that it earns its own skill rather than a subsection of
`motion-canvas-authoring`, so the specific font and highlighter knowledge is easy to find
again rather than buried in a general authoring guide. Research into the scene's history
(file contents plus `git log` on `animations/`) found two distinct, compounding problems,
not one — the skill needs to document both, since they look superficially similar
("text isn't rendering right") but have unrelated root causes and fixes.

**Problem 1: canvas text rendering silently ignores an unloaded font.** `<Code>` renders
onto an HTML5 `<canvas>`, not DOM text, so naming a font in `fontFamily` does nothing
unless that exact font has separately been loaded into the document via normal CSS font
loading first. `shiny-ellmer.tsx` sets `fontFamily="'JetBrains Mono', 'Fira Code',
monospace"`, but **no JetBrains Mono font file or import exists anywhere in the repo** —
only Fira Code (via a Google Fonts `@import`) and Open Sans (a local file) are actually
loaded, via `animations/global.css`, which is imported directly in the Motion Canvas
*project* entry file (`import '../global.css';` in `shiny-ellmer.ts`), not via any
Quarto/HTML `<link>` tag. So the animation silently renders in Fira Code (or a generic
monospace fallback), despite JetBrains Mono being listed first — there is no error, just
the wrong font, which is exactly the kind of bug that eats disproportionate time. Three
separate, duplicate `@font-face` declarations for Open Sans exist across `global.css`,
`theme.scss`, and a leftover `custom-old.css`, consistent with repeated trial-and-error
across the Motion-Canvas/Vite build and the separate Quarto/reveal.js build while chasing
this.

**Problem 2: `lezer-r` parses R correctly but carries no semantic highlighting tags.**
Unlike `@lezer/javascript` and other official grammars, the community `lezer-r` package
produces a correct concrete syntax tree (node types like `Identifier`, `FunctionCall`,
`AssignmentOperator`, `ExtractionOp`) but does not attach Lezer's standard highlighting
tags to those nodes, so Motion Canvas's normal `HighlightStyle`-based pipeline produces no
colour information at all for R code. The fix, `components/RHighlighter.ts`, sidesteps
the tag layer entirely: it implements Motion Canvas's `CodeHighlighter<TCache>` interface
directly, walks the raw concrete syntax tree, and switches on `node.name` to build a flat
`Map<"start-end", color>` that `highlight()` scans per character index. It encodes one
piece of real logic the parser doesn't give for free: distinguishing a function name from
a plain variable reference by checking `node.parent.name === 'FunctionCall'`. The full,
working implementation already exists at
`conf-2025-working-with-infosec/animations/src/components/RHighlighter.ts` (WSL) and
should be copied into this skill's `components/RHighlighter.ts` verbatim, not
reconstructed from the summary here.

**The TypeScript shim**: `lezer-r` ships no type declarations, so
`animations/src/lezer-r.d.ts` (three lines: `declare module 'lezer-r' { export const
parser: any; }`) exists purely so `import {parser} from 'lezer-r'` compiles. Copy this
file verbatim too.

**A real misplaced-dependency bug to fix while porting, not just document**: `lezer-r` is
imported and used in `animations/src/scenes/shiny-ellmer.tsx`, but it is declared as a
dependency of the **root** project's `package.json` (alongside `@motion-canvas/core` and
`@motion-canvas/player`, the player-runtime project — see "Project architecture and
bootstrap" above), not `animations/package.json`, the project that actually imports and
compiles it. An earlier research pass that looked only at `animations/package.json` read
this as `lezer-r` being missing entirely; it is present, just one level up from where it
is used. This apparently still resolves today (Vite/Node module resolution can walk up
past a sub-project's own `node_modules`), but it is fragile and worth fixing properly
rather than documenting as acceptable: add `lezer-r` to `animations/package.json`'s own
dependencies as part of promoting this skill, and confirm a fresh `npm --prefix
./animations install` resolves it without relying on the root project's copy.

**R code content patterns**: the actual `.claude/shiny-ellmer-code.R` content exercises
`<-` assignment, `$` extraction (`input$submit`), function calls, string literals, and
`#` comments — no pipe operator (`|>`/`%>%`) appears in the final version, so pipe
highlighting was not a forcing factor for the current `RHighlighter` node-type coverage.
If a future scene's R code uses the pipe, `RHighlighter`'s `switch` will need a
`BinaryExpression`/pipe-operator case added — flag this as a known gap, not an oversight.

This skill's `components/RHighlighter.ts` and `lezer-r.d.ts` are the canonical copies;
the shared library (section 4) does not carry its own copy, to avoid two sources of truth
for the same file. The skill's `references/fonts-and-highlighting.md` should state the
canvas-text/CSS-font-loading mechanism explicitly — it is the one most likely to bite
again on a future scene that displays any text with a non-default font, not just R code.

### 8. Seed content

Two kinds of seed material, copied into the new project as worked examples rather than
shared library code — material to point at and learn from, not to import:

**Hand-built scenes**, deduplicated across the three source projects per the corrected
findings in Background:
- `posit_logo.tsx` from both PMDS and goes-paddling, kept as two separate files (e.g.
  `seed/scenes/posit_logo-pmds.tsx` and `seed/scenes/posit_logo-paddling-boat.tsx`) since
  they are genuinely different animations, not duplicates — the goes-paddling version is
  a good second worked example of path-morphing plus `waitUntil` timed events.
- `kayak.tsx` from goes-paddling: the hand-built vector-path character animation using
  raw coordinate arrays and signal-driven interpolation between poses. Worth a light
  cleanup on import (it has dead commented-out code and at least one stray typo-as-JSX-
  text artifact, e.g. a bare `3` and `Rec` appearing as literal text nodes) rather than
  importing its rough edges verbatim.
- `one23.tsx` from PMDS: the minimal counting-animation demo, useful as the smallest
  possible worked example.
- `rpy.tsx` and `example.tsx`/`scene2.tsx` are not seeded: the former has its animation
  commented out (low value as-is) and the latter is Motion Canvas's own starter-template
  demo, not original content.

**SVG-to-animation pairs**: the three draw.io-sourced diagrams and their matching scenes
already live together in the WSL copy of `conf-2025-working-with-infosec`
(`_img/infosec_triad.drawio.svg` ↔ `infosec-triad.tsx`,
`_img/multiple_sources.drawio.svg` ↔ `multi-database.tsx`,
`_img/llm_app.drawio.svg` ↔ `shiny-ellmer.tsx`). Note these are single-file draw.io
exports — the draw.io source XML is embedded inside the SVG's own `content` attribute,
there is no separate sidecar source file to also copy. Copy the three `.drawio.svg`
files into `seed/diagrams/` and reference the three matching scenes directly from the
WSL infosec project (or copy them alongside, if the project is later deleted or moved).
These three pairs are also the "Proven Examples" the `svg-to-motion-canvas` skill already
documents — the seed copy and the skill's own worked-examples reference should point at
the same three pairs, not duplicate the description independently.

### 9. Quarto extension provenance

No new extension work: the `andrie/motion-canvas` Lua extension continues to live in
each presentation project's own `_extensions/` folder, copied in via `quarto add` as
`quarto-presentation`'s `extensions.md` already documents. The one addition is a note —
in `quarto-presentation`'s own documentation, not a new skill — recording that **the WSL
copy of `conf-2025-working-with-infosec` is the canonical, most-correct version** of this
extension (proper `loop="false"` attribute handling, the frame-tracking fix for the
stop-at-end race condition, a `DEBUG_ENABLED` log gate), confirmed by direct diff against
the other three copies, which are older and share the same less-correct behaviour. If the
extension is ever next copied into a new project, copy it from there, not from PMDS,
goes-paddling, or the Windows copy of infosec.

### 10. Cross-reference from `quarto-presentation`, and the shortcode-semantics gap

Two additions to `quarto-presentation`, both reached via its existing `andrie/motion-canvas`
section in `extensions.md`:

**A one-line pointer**, added after the point where that section says to reach for this
"for one genuinely illustrative animation": a reference to the `svg-to-motion-canvas` and
`motion-canvas-authoring` skills for designing that animation's content once the decision
to include one has been made, and to `motion-canvas-r-code` specifically when the
animation involves displaying code.

**A new reference file**, `quarto-presentation/references/motion-canvas-shortcode.md`,
for the shortcode-mechanism detail below — this is substantial enough to warrant its own
file rather than growing the existing `andrie/motion-canvas` write-up in `extensions.md`
indefinitely, matching the pattern `extensions.md` already uses to point out to
`narrative.md` and the brand-profile reference files rather than inlining everything.
`extensions.md`'s own entry keeps its existing option-name list and examples, and gains
one line pointing at this new file for the mechanism.

`extensions.md` already lists the shortcode's option names (`fullscreen`, `background`,
`loop=false`, `auto`, `width=`) and one example of each, but reading
`_extensions/andrie/motion-canvas/motion-canvas.lua` directly (the WSL
`conf-2025-working-with-infosec` copy, per "Quarto extension provenance" above) surfaces
mechanism detail that isn't written down anywhere, and which actually explains real usage
patterns across all four surveyed presentation projects. The new reference file should
cover, since the mechanism is what lets Claude reach for the right combination of options
rather than guessing from the four examples already in `extensions.md`:

- **`fullscreen` and `width` are mutually exclusive**, not just independently optional:
  the Lua code only emits a `width:` style when `fullscreen` was *not* set — setting both
  silently drops `width`. `kayak.js`'s `width="50%"` usage only works because it omits
  `fullscreen`.
- **`background` only adds `z-index: -1`** to the generated inline style; it does not
  imply `fullscreen` on its own. The actual section-divider pattern that appears
  repeatedly across PMDS (six times) and infosec (once) — confirmed by grepping every
  surveyed project's `.qmd` for `motion-canvas` shortcode usage, not assumed from scene
  inventory — always combines **both**: `{{< motion-canvas ./animations/hexagons.js
  background fullscreen loop=false >}}`. Document this specific three-option combination
  as the named "section divider" recipe, not just the individual option meanings, since
  that is the form actually used in practice.
- **`loop` defaults to true** and the attribute is only emitted at all when explicitly set
  to `false` — there is no way to write `loop="true"` explicitly in the generated HTML,
  only its absence (meaning loop) or `loop="false"` (meaning don't).
- **`auto` only emits the attribute when `"true"`** — there is similarly no explicit
  `auto="false"` in the generated HTML; omitting `auto` entirely is how a slide is told
  not to autoplay (matching reveal.js's `slidechanged` handler setting `auto=true`
  itself when the slide becomes active, per `motion-canvas-player.js`).

**The `.hidetitle` convention** is a separate, non-obvious pairing worth its own callout,
since it is easy to produce a deck where an animation plays correctly but the slide's own
Quarto-rendered heading text is still visible on top of or beside it:
```markdown
## Working with Infosec {.hidetitle autoslide=15000}
{{< motion-canvas ./animations/src/posit_footer.js auto fullscreen=true >}}
```
`.hidetitle` is a CSS class (defined in the house theme, e.g. `theme.scss`'s
`.hidetitle > h1, .hidetitle > h2 { ... }`) that hides the heading element Quarto still
renders for every slide, regardless of content. **Whenever a slide's entire content is
the animation itself** — a title slide, an end slide, a full-bleed section divider — the
heading needs `.hidetitle` or the slide's title text renders on top of the animation.
This is distinct from choosing *not* to have a heading at all (an unlabelled `#`/`##`):
Quarto still reserves heading space and may still render it unless `.hidetitle`
suppresses it. Document this pairing directly next to the `fullscreen`/`background`
section-divider recipe above, since the two are almost always used together in practice.

These two additions, plus the extension-provenance note in section 9, are the only
changes to `quarto-presentation`; it is not restructured.

### 11. Validation: the Positron talk

Once promotion, porting, and extraction are done, use the Positron-features talk as the
first real test: start a new presentation project, invoke `quarto-presentation` to plan
the deck as normal, and for the one or two slides that earn a genuinely illustrative
animation, invoke the promoted Canvas Commons skills end to end (scene creation via
`add-scene.js`, composition via `motion-canvas-authoring`, SVG translation via
`svg-to-motion-canvas` where a diagram is involved, embedding via the existing
`quarto-presentation` shortcode conventions). Treat friction found here as the signal for
what the promoted skills still got wrong, rather than planning further ahead of this
test.

## Testing

- After porting, build at least one existing scene from each of the three source
  projects against `@canvas-commons/*` packages (`make anim` or equivalent) to confirm
  the rename-only assumption holds in practice, not just on paper.
- After extracting the shared library, point one existing project's
  `animations/src/styles.ts` imports at the shared copy and rebuild, to confirm the
  relative-path reference works before relying on it for a new project.
- Fresh-install test for `motion-canvas-r-code`: after adding `lezer-r` to
  `animations/package.json` directly (per the misplaced-dependency fix above), run
  `npm --prefix ./animations install` in a clean checkout and confirm it resolves
  without depending on the root project's copy of the same package.
- Rebuild `shiny-ellmer.tsx` (or its ported equivalent) after the Canvas Commons port and
  visually confirm the R code panel still renders in the intended font and with working
  highlighting — the font-loading mechanism (`global.css` imported from the project entry
  file) is exactly the kind of implicit dependency that a mechanical package-rename pass
  could silently break.
- The Positron talk (section 11) is the end-to-end test for the whole project; no
  additional synthetic test scenes are needed beyond it.

## Open questions carried into implementation planning

- Whether the Canvas Commons fork's docs-build commands
  (`npx lerna run build`, `npm run core:bundle`, `npm run 2d:bundle`, `npm run docs:build`)
  still work unchanged needs confirming against a fresh clone before the generation
  scripts are relied on.
- Whether `RHighlighter`'s `switch` needs a pipe-operator (`|>`/`%>%`) case added — the
  current implementation was never exercised against R code using the pipe, since
  `shiny-ellmer-code.R` doesn't use one. Treat as a known gap to fill if a future scene's
  R code needs it, not a defect in the existing skill content.
