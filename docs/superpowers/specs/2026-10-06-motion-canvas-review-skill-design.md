# Design: the motion-canvas-review skill

## Purpose

Add a skill that reviews a Canvas Commons scene for reuse opportunities, so people using this repo's skills write tighter scenes. The reviewer is Claude, working on a scene it or a user wrote. The output is a ranked list of findings, each with a suggested level of reuse. The review advises and does not rewrite the scene unless the user asks.

The trigger for this work was a generated Positron IDE mockup scene (about 420 lines) that repeats tabs, variable rows, panel labels and feature chips, computes every position from `top`/`left`/`cy` offsets, and mutates chips by child index. That scene is the worked example, not a component to ship.

## Context in the repo

- `motion-canvas-authoring` already shows `gridPoly` (a plain helper) and a `Database` sketch (a class component). It has no function-component example and no rule for choosing between the three. At about 1,300 words it is already over the 500-word guideline, so it should not grow.
- `motion-canvas-authoring/references/app-window-mockup.md` already solves window chrome with one flex layout and no pixel arithmetic. A reviewer should flag scenes that hand-position a window instead of using it.
- `docs/superpowers/specs/2026-10-06-reusable-component-patterns-addendum.md` describes the three levels. It is untracked and unreviewed, so this skill carries the rules itself and does not depend on it or edit it.

## Skill shape

A new skill, `skills/motion-canvas-review/`, with a `SKILL.md` and one reference file. `motion-canvas-authoring` gets a single line telling authors to run this review before finishing a scene. No other existing skill changes.

### Frontmatter

- `name: motion-canvas-review`
- `description`: triggers only, along the lines of "Use when reviewing, tidying or refactoring a Canvas Commons scene, or after generating one, to find repeated code that should be a helper or component."

## SKILL.md content

1. **Process:** read the whole scene, scan for the signals below, assign each hit a level, report.
2. **Signals to scan for:**
   - Blocks that repeat with only strings or numbers changing.
   - Positions built from shared offsets, which usually means flex layout or local coordinates.
   - Index-based child mutation such as `chip.children()[0] as Rect`.
   - One state change needing several imperative `.text()` or `.fill()` calls, which suggests signals on a class.
   - Palettes, highlighters or generic helpers that belong outside the scene.
   - Existing patterns left unused: `app-window-mockup.md`, library components, `pulse`.
3. **Decision ladder:**
   1. Plain helper function: stateless, instance count driven by a loop or formula.
   2. Function component with props: roughly 3 to 10 similar instances with per-instance overrides, no signals of its own.
   3. Class component with signals: properties that animate after creation, or state spanning several nodes.
4. **Don't extract:** fewer than three uses, or a one-off layout, stays inline.
5. **Where the result lives:** scene-local first, then the project's `animations/src/components/` when two scenes need it. A consumer project never proposes edits to `canvas-commons-library`.
6. **Report format:** one entry per finding with evidence (line range or call count), level, expected saving, and risk. A risk is a behaviour change, for example a snap becoming a tween.

## Reference file

`references/positron-scene-review.md`: a condensed version of the Positron scene, with before and after for two or three extractions (for example `EditorTab`, `VarRow`, and `FeatureChip` as a class with `text` and `accent` signals), and a sample report. Snippets are illustrative and not importable. If the owner prefers the skill not to contain this scene, it is replaced by a neutral invented scene with the same structure.

## Testing

- Skill behaviour: run the review on the Positron scene in a subagent with and without the skill, and check that the skill changes what it finds (the `children()[0]` mutation, the unused window pattern and the level assignments are the expected differences). Verify the subagent's report against the scene itself.
- Snippets: build any code in the reference file in a real project, as the existing references did, before stating that it works.
- Repo checks: run `TS_PATH=... node --test tests/*.test.js` and `bash scripts/check-ported.sh`. Confirm `scripts/install.sh --dry-run --target <tmp dir>` lists the new skill and that `README.md` and `CLAUDE.md` layout lists mention it.

## Out of scope

- Rewriting scenes automatically, or a script that detects repetition.
- Moving any Positron component into `canvas-commons-library`.
- Applying or editing the reusable-component-patterns addendum.
- Editing the global `quarto-presentation` skill.
