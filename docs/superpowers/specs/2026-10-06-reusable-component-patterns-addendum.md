# Reusable component patterns: addendum to the Quarto Canvas Commons skill design

This is a short, self-contained addendum to
`docs/superpowers/specs/2026-10-06-quarto-canvas-commons-skill-design.md` (the main
design spec for this project). Read that spec first for full context on the skill
promotion/porting project this slots into — this document only covers one gap found in
it: the main spec's `motion-canvas-authoring` skill shows one reuse pattern (a
class-based custom component) but not the two lighter-weight patterns that are actually
more common across the surveyed conference projects, and doesn't frame the choice between
the three as a deliberate decision with its own tradeoffs.

## Overview

- **Situation**: the main design spec promotes `motion-canvas-authoring` with a "Custom
  Component Pattern" section showing `Database` (a class extending `Layout`, with
  reactive `@signal()` props) as the example of building a reusable animated component.
- **Complication**: direct inspection of the three surveyed conference projects
  (`PMDS`, `goes-paddling`, `conf-2025-working-with-infosec`) found two other reuse
  patterns in active use, both lighter-weight than a class component, and both more
  common in practice — one of them (a plain helper function called in a loop) produces
  the single largest compactness win found anywhere in the surveyed code. Neither pattern
  is currently documented in any promoted skill, so a scene author has no guidance on
  when a full class component is overkill and a plain function would do.
- **Question**: should the promoted `motion-canvas-authoring` skill teach all three reuse
  patterns as a deliberate, named choice, not just the heaviest one?
- **Answer**: yes. Add a short "three levels of reuse" subsection to
  `motion-canvas-authoring`, with the three patterns found by direct inspection below as
  its worked examples, each annotated with concrete before/after line counts so the
  tradeoff is legible rather than abstract.

## Findings: three patterns, by direct inspection

All figures below come from reading the actual files, not from filenames or
descriptions — line counts and call counts are measured, not estimated from a summary.

### 1. Plain helper function returning one shape, called in a loop

**`gridPoly(ref, x, y, size, opacity)`** in PMDS's `animations/src/scenes/hexagons.tsx`
(8 lines: a plain function, not a class, returning one `<Polygon>` tag). Called from a
nested loop over rows and columns — **126 times** (9 columns × 14 rows) — to build the
hexagon-grid background pattern.

This is the single most dramatic compactness win found anywhere in the surveyed
projects: 8 lines of definition replace what would otherwise be roughly 126 × ~10 lines
≈ 1,260 lines of repeated `<Polygon>` JSX with the same position-math inlined at every
call site — a saving of roughly **1,250 lines**. The pattern earns its keep the moment a
shape needs to appear more than a handful of times with per-instance parameters
(position, size, opacity) that follow a formula.

**When to reach for this**: the shape is stateless (no reactive props, no runtime
re-tweening of the component itself after creation), and the number of instances is
driven by a loop or a formula rather than by hand-authoring each one.

### 2. Function component (JSX template with props)

Two examples in PMDS's `animations/src/scenes/pipeline.tsx` (same file duplicated,
with PMDS's revision being the more refined one per the main spec's shared-library
sourcing decision):

- **`TxtRect({text, textFill, ...props})`** (14 lines) — returns a styled
  `<Rect><Txt/></Rect>` label box. Called 5 times (`tr.hcc`, `tr.quarto`, `tr.gha`,
  `tr.gh`, `tr.ide`), each call collapsing to 1 line versus ~6 lines of raw `Rect`+`Txt`
  per instance — saving roughly **25 lines** (5 × 5).
- **`ConnectingLine(refs)`** (18 lines) — returns one `<Line>` with a fixed arrow/dash
  configuration, taking its endpoints via a `refs` prop. Called 4 times (`ide_gh`,
  `gh_gha`, `gha_quarto`, `quarto_hcc`), each call 1 line versus ~15 lines of raw `Line`
  configuration per instance — saving roughly **56 lines** (4 × 14).

This pattern sits between the other two: it is a plain function (not a class, no
decorators, no reactive signals of its own), but unlike `gridPoly` it is parameterised
by named props and spread syntax (`{...props}`) rather than positional arguments, which
reads more like a genuine mini-component when there are several call sites with varying
overrides rather than a tight loop.

**When to reach for this**: a handful of similar-but-not-identical instances (roughly
3–10), each wanting to override one or two specific properties, where a full class
component's reactive-signal machinery would be unnecessary ceremony.

### 3. Class component with reactive props

**`Database`** in `conf-2025-working-with-infosec/animations/src/components/Database.tsx`
(73 lines total; ~45 lines of actual constructor/shape-building logic). A proper Motion
Canvas component: `class Database extends Layout`, with `@signal() stroke` (default
`#447099`) and `@signal() lineWidth` (default `4.5`) as reactive props, internally
composed from 2 `<Circle>` (top ellipse, bottom half-arc via `startAngle`/`endAngle`) and
2 `<Line>` (the cylinder's vertical sides).

Used 4 times across 2 scenes: once in `infosec-triad.tsx`, three times in
`multi-database.tsx` (`databaseCenter`, `databaseLeft`, `databaseRight`), each call site
~7 lines (ref, size, stroke, lineWidth, position, opacity) versus an estimated ~40–45
lines to reproduce one database by hand (the same 4-primitive composition plus the
reactive wiring). The 3 uses in `multi-database.tsx` alone save roughly **114 lines**
((45−7) × 3); the one-time use in `infosec-triad.tsx` means the 73-line definition has
already paid for itself by the second use anywhere in the codebase.

The genuine advantage over the other two patterns is **encapsulation with runtime
reactivity**: because `stroke` and `lineWidth` are real Motion Canvas signals, each
`<Database>` instance can be independently re-tweened after creation
(`databaseLeft().stroke(Posit.orange, 1)`) without touching the class definition — this
is not possible with `gridPoly` or `TxtRect`/`ConnectingLine`, which are plain JSX
templates evaluated once at call time, not stateful objects.

**When to reach for this**: the shape needs properties that change over the scene's
lifetime (not just at creation), or the shape is complex/stateful enough that a plain
function would need to return multiple refs and manual wiring to achieve the same thing.

## Design: what to add to the skill

Add a short subsection to `motion-canvas-authoring/SKILL.md` (the promoted skill from the
main design spec), near its existing "Custom Component Pattern" section, titled something
like **"Three levels of reuse"**:

- A short table or three short paragraphs presenting the three patterns above in
  increasing order of weight: plain helper function → function component → class
  component with reactive props.
- For each: the decision rule from "When to reach for this" above, stated as a
  rule-of-thumb an author can apply while writing a new scene, not just a description of
  the existing examples.
- Keep the existing `Database` example as the class-component worked example (it is
  already there); add `gridPoly` as the plain-helper-function worked example and
  `TxtRect`/`ConnectingLine` as the function-component worked example, since all three
  already exist as real, proven code in the shared library and seed content the main spec
  already promotes/seeds — no new code needs to be written for this, only the teaching
  material around it.
- `gridPoly` lives inside the shared library's `hexagons.tsx` (per the main spec's
  section 4, "Shared component/style library") and `TxtRect`/`ConnectingLine` live inside
  the shared library's `pipeline.tsx` (same section) — both are already being promoted as
  shared code, so this addendum adds documentation, not new files, beyond the skill's own
  `SKILL.md` edit.

## Out of scope

- No new component code. All three examples already exist in material the main spec
  already promotes into the shared library or seed content.
- No change to the main spec's choice of `Database` as the canonical class-component
  example — this addendum adds the two lighter patterns alongside it, it does not
  replace or re-evaluate that choice.
- No attempt to extract `gridPoly` or `TxtRect`/`ConnectingLine` into the shared
  component library as independently importable functions (unlike `Database`, which the
  main spec already extracts as a standalone file). They are useful as *patterns to
  imitate* when writing a new scene's own local helper functions, not as generic
  utilities meant to be imported — `TxtRect`'s styling and `gridPoly`'s hexagon-specific
  math are scene-specific, not general-purpose.

## Testing

No new code to test. The only verification needed is that the added "Three levels of
reuse" subsection in `motion-canvas-authoring/SKILL.md` accurately describes the three
existing worked examples (`gridPoly` in `hexagons.tsx`, `TxtRect`/`ConnectingLine` in
`pipeline.tsx`, `Database` in `components/Database.tsx`) — a reviewer should be able to
open each file, cross-check the line counts and call counts stated above still hold, and
confirm the decision rules are stated as actionable guidance rather than restating the
examples.
