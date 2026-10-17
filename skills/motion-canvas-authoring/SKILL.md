---
name: motion-canvas-authoring
description: Use when composing Canvas Commons (formerly Motion Canvas) components into an animated scene for a presentation and you want proven layout, timing and style patterns.
---

# Motion Canvas Scene Authoring Patterns

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

Before writing a scene, read `animations/src/styles.ts` (shipped by the `motion-canvas-scene` project template, a snapshot of `canvas-commons-library/styles.ts`) for current color and font values. Use the `Posit` and `Colors` objects rather than hardcoding hex values.

New scenes are created and registered with `${CLAUDE_SKILL_DIR}/../motion-canvas-scene/scripts/add-scene.js` (see the `motion-canvas-scene` skill). `Database`, `pulse` and the library scenes are not in a fresh project: they come from the optional library symlink at `animations/src/lib` (import from `../lib/...`), and `RHighlighter` comes from the `motion-canvas-r-code` skill.

## Standard Scene Skeleton

Every scene follows this structure:

```typescript
import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor, all} from '@canvas-commons/core';
import {Rect, Txt, Line, Layout} from '@canvas-commons/2d';
import {Posit, Colors} from '../styles';

export default makeScene2D(function* (view) {
  // 1. Create references (grouped by purpose)
  const boxA = createRef<Layout>();
  const boxB = createRef<Layout>();
  const connection = createRef<Line>();

  // 2. Define constants
  const boxWidth = 270;
  const boxHeight = 135;

  // 3. Add all elements to view
  view.add(
    <>
      {/* Elements here */}
    </>
  );

  // 4. Animation sequence
  yield* waitFor(1);
  yield* all(
    boxA().opacity(1, 2),
    connection().opacity(1, 2),
  );
});
```

Key rules:
- Declare all refs upfront before `view.add()`, grouped by purpose (elements, connections, text)
- Use fragments (`<>...</>`) as root container in `view.add()`
- Keep animation logic after the view.add() block

## Application window mockups

`references/app-window-mockup.md`: draw an application window (title bar, activity bar, tabs, editor and console panes, status bar) as one flex layout from a small helper, with a palette object for the application's colours and the offset formula for overlays placed from the window's top-left.

## Custom Component Pattern

Extend Layout for reusable animated components. This sketch shows how the library's `Database` is built; for a database cylinder, import the existing one from `../lib/components/Database` instead of rewriting it.

```typescript
import {initial, signal} from '@canvas-commons/2d';
import {Layout, LayoutProps, Circle, Line} from '@canvas-commons/2d';

export interface DatabaseProps extends LayoutProps {
  stroke?: SignalValue<PossibleColor>;
  lineWidth?: SignalValue<number>;
}

export class Database extends Layout {
  @initial('#447099')
  @signal()
  public declare readonly stroke: SimpleSignal<PossibleColor, this>;

  @initial(4.5)
  @signal()
  public declare readonly lineWidth: SimpleSignal<number, this>;

  public constructor(props?: DatabaseProps) {
    super({ ...props, size: props?.size ?? [90, 60] });
    // Build internal structure with reactive bindings
    this.add(<>
      <Circle width={() => this.width()} height={ellipseHeight}
              stroke={() => this.stroke()} lineWidth={() => this.lineWidth()} />
      {/* ... more children ... */}
    </>);
  }
}
```

## Reusable animation utilities

The library already has this one as `pulse` (`../lib/utils/pulse`). The sketch shows the pattern for writing your own.

```typescript
export function* pulse(element: any, options: { scaleGrowth?: number; duration?: number } = {}) {
  const { scaleGrowth = 0.1, duration = 0.5 } = options;
  const currentScale = element.scale();
  const targetScale = currentScale.add(scaleGrowth);
  yield* element.scale(targetScale, duration / 2, easeInCubic);
  yield* element.scale(currentScale, duration / 2, easeOutCubic);
}
```

## Style Conventions

- **Diagram labels**: `fontFamily="Helvetica"`, `fontSize={63}`, `fill={Posit.blue}`
- **Code text**: `fontFamily="'JetBrains Mono', monospace"`, `fontSize={24}`
- **Transparent fills**: always `"rgba(0,0,0,0)"`, never `"transparent"`
- **Colors**: always from `Posit` and `Colors` objects, as shipped in `animations/src/styles.ts`
- **Consistent proportions**: maintain lineWidth ratios across related elements in a scene

## Before you finish a scene

Run the `motion-canvas-review` skill on it. It finds repeated blocks, hand-built offsets and state changes that a helper or component would simplify.

## Patterns by kind

`references/patterns.md` has proven patterns for diagram and architecture scenes (labelled boxes, connection lines, progressive reveal), grid and pattern scenes, geometric scenes (polygons with vertex-anchored text), logo and path scenes, and code display scenes (R highlighting, terminal output, line-by-line reveal). Read the section for the kind of scene you are building before writing it.
