---
name: motion-canvas-review
description: Use when reviewing, tidying or refactoring a Canvas Commons (formerly Motion Canvas) scene, or after generating one, to find repeated code that should be a helper or component.
---

# Reviewing a scene for reuse

Review a scene for repeated or hand-built code that a helper, a function component or a class component would remove. Report findings and advise. Do not rewrite the scene unless the user asks.

This applies to Canvas Commons scenes (`makeScene2D` files). If the file is not one, say so and stop.

## Process

1. Read the whole scene before judging any part of it.
2. Scan for the signals below and note the line range of each hit.
3. Give each hit a level from the ladder, or "leave inline".
4. Check the project and `motion-canvas-authoring` for something that already does the job before suggesting new code.
5. Write the report in the format at the end.

If nothing qualifies, say "nothing to extract" and give the reason. Do not invent findings.

## Signals

- A block repeats with only strings or numbers changing.
- Positions are built from shared offsets such as `top + titleH + i * 68`. Flex layout (`layout`, `direction`, `gap`, `grow`) or a parent node with local coordinates removes the arithmetic. For windows, see `motion-canvas-authoring/references/app-window-mockup.md`.
- Children are changed by index, such as `chip.children()[0] as Rect`. The structure and the code that edits it are coupled, so make the parts props or signals.
- One state change needs several imperative `.text()`, `.fill()` or `.opacity()` calls on different nodes. Put the state in signals on a class so one call drives them all, and so the change can tween instead of snap.
- Palettes, highlighters or generic helpers such as `typeCode` sit inside a scene that another scene could use.
- The scene rebuilds something the project or `motion-canvas-authoring` already provides: a library component, `pulse`, the window mockup helper.

## Decision ladder

1. **Plain helper function.** Stateless, and a loop or formula drives the instance count. It returns one shape and takes positional arguments (`gridPoly(ref, x, y, size, opacity)`).
2. **Function component.** About 3 to 10 similar instances, each overriding one or two properties. A plain function taking a props object and spreading `{...props}`. No decorators and no signals of its own.
3. **Class component.** Properties must change after creation, or one piece of state drives several nodes. It extends `Layout` or `Rect`, with `@signal()` props, as in the `Database` sketch in `motion-canvas-authoring`.

Choose the lightest level that works. Move up only when a lighter one needs manual wiring to do the same.

## Leave it inline

- Fewer than three uses.
- A one-off layout that nothing else will repeat.
- Two instances that differ in structure and not only in values.

## Where the result lives

Scene-local first. When a second scene needs it, move it to the project's `animations/src/components/`. A project using this skill never edits `canvas-commons-library`; suggest that only to the library's owner.

## Report format

One entry per finding, most valuable first:

- **Where:** line range, or call count.
- **Signal:** which signal from above.
- **Level:** helper, function component, class component, existing pattern, or leave inline.
- **Saving:** lines removed, estimated and labelled as an estimate.
- **Risk:** any behaviour change, for example a snap becoming a tween, or a ref that must now be passed through.

`references/positron-scene-review.md` is a worked example: a long IDE mockup scene, the findings it produces, and the code before and after for three of them.
