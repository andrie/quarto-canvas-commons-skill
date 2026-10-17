---
name: motion-canvas-api
description: Use when writing or debugging Canvas Commons (formerly Motion Canvas) animation code and you need to know which node, signal, tween or layout property to use.
---

# Canvas Commons (Motion Canvas) API reference (v0.4.0)

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

Import everything from the package roots, `@canvas-commons/core` and `@canvas-commons/2d`: the 0.4.0 packages have no `lib/...` deep imports. Older projects used the `@motion-canvas/*` scope (PORT-NOTE: deliberate mention of the old scope), and `@canvas-commons/editor` replaces the old `ui` package.

## Looking things up

Two files under `references/` are generated from the Canvas Commons 0.4.0 source, so they list the real exported API rather than what this page remembers: `component-hierarchy.md` (the class tree and what each node inherits) and `api-search-index.json` (800+ exported classes, functions, types and enums with signatures, descriptions, members and examples). `references/using-the-index.md` explains how to query them; short keywords work best. The timing and easing functions (`all`, `chain`, `delay`, `loop`, `tween`, `easeInOutCubic` and the rest) come from `@canvas-commons/core`, not `@canvas-commons/2d`.

## Scene Creation

```typescript
import {makeScene2D} from '@canvas-commons/2d';
import {createRef} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  // Scene logic here
});
```

## Node Types

### Visual nodes
- **Rect** — rectangles/squares with fill, stroke, rounded corners (`radius`)
- **Circle** — circles, ellipses, arcs, sectors (`startAngle`, `endAngle`)
- **Txt** — text with font, size, color, alignment
- **Line** — lines and polygonal paths from a `points` array; supports `startArrow`, `endArrow`, `arrowSize`
- **Polygon** — regular polygons via `sides` property; `vertex(index)` returns exact vertex coordinates
- **Img** — images and sprites
- **Code** — code display with syntax highlighting (see Code Component section)
- **SVG** — SVG rendering with animation support
- **Latex** — LaTeX equation rendering
- **Grid** — 2D grid
- **Icon** — 150k+ icons via icones.js.org
- **Ray** — individual line segment
- **Path** — arbitrary SVG path via `data` property; animatable with `path().data(newPath, duration)`
- **Bezier**, **CubicBezier**, **QuadBezier** — Bezier curves
- **Spline** — smooth curves through points (with **Knot** nodes)
- **Video** — video playback
- **Camera** — orthographic camera

### Structural nodes
- **Node** — base class, invisible, used for grouping and transforms
- **Layout** — flexbox container (see Layout section)
- **View2D** — scene root (the `view` parameter)

## Common Properties

All nodes inheriting from Layout support:

| Property | Type | Description |
|----------|------|-------------|
| `position` | `[x, y]` | Position relative to parent |
| `size` | `[w, h]` | Width and height |
| `fill` | color string | Fill color |
| `stroke` | color string | Stroke color |
| `lineWidth` | number | Stroke width |
| `opacity` | 0-1 | Transparency |
| `scale` | number or `[x, y]` | Scale factor |
| `rotation` | degrees | Rotation |
| `anchor` | `[-1..1, -1..1]` | Origin anchor (`anchorX`, `anchorY`; was `offset` before 0.4.0) |

`anchor` sets which point of the node `position` refers to, as a fraction of its half-size: `-1` is the left (x) or top (y) edge, `0` the centre (the default), `1` the right or bottom edge. It is also the pivot for `rotation` and `scale`, but it does not move the node's children.

```tsx
// Left-aligned text: x is where the text starts, y is its vertical centre
<Txt anchor={[-1, 0]} position={[-800, -400]} text="Starts at x = -800" />
// A box whose top-left corner sits at (-800, -300)
<Rect anchor={[-1, -1]} position={[-800, -300]} size={[400, 200]} fill="#447099" />
// One axis only: right-align a label to x = 800
<Txt anchorX={1} x={800} text="Ends at x = 800" />
```

## Coordinate System

- Origin at **center** of the scene
- **x** increases to the right
- **y** increases **downward**
- All positions are relative to parent node
- Use `absolutePosition()` for world-space coordinates
- Use `node.worldToParent()` / `node.localToWorld()` for matrix transforms

## References

```typescript
// Single reference
const rect = createRef<Rect>();
<Rect ref={rect} />
rect().fill('red'); // access via ()

// Array of references
const items: Rect[] = [];
{range(10).map(i => <Rect ref={makeRef(items, i)} />)}

// Auto-appending array
const items = createRefArray<Rect>();
{range(10).map(() => <Rect ref={items} />)}

// Named reference map
const labels = createRefMap<Txt>();
<Txt ref={labels.title}>Title</Txt>
<Txt ref={labels.subtitle}>Sub</Txt>
labels.title().text('New', 1);
```

## Signals

Reactive values that auto-update dependents.

```typescript
// Create
const value = createSignal(0);

// Read
value();

// Set
value(42);

// Tween
yield* value(100, 2); // animate to 100 over 2 seconds

// Computed signal
const doubled = createSignal(() => value() * 2);

// Reset to initial
value(DEFAULT);

// Node properties ARE signals
yield* rect().fill('#ff0000', 1);
yield* rect().position.x(200, 1);
```

## Animation Flow

```typescript
// Execute animation and wait
yield* rect().scale(2, 1);

// Single frame (no wait)
yield;

// Parallel — all at once
yield* all(
  rect().position.x(200, 1),
  rect().rotation(90, 1),
  rect().scale(1.5, 1),
);

// Sequential — one after another
yield* chain(
  rect().position.x(200, 1),
  rect().rotation(90, 1),
);

// Staggered — each starts `delay` seconds after previous
yield* sequence(0.1, ...rects.map(r => r.scale(1, 0.5)));

// Delayed start
yield* delay(0.5, rect().opacity(0, 1));

// Loop
yield* loop(3, () => rect().scale(1.2, 0.3).to(1, 0.3));

// Wait
yield* waitFor(2);

// Wait for named time event (set in Motion Canvas UI)
yield* waitUntil('myEvent');
```

## Important Gotchas

- Use `"rgba(0,0,0,0)"` for transparent fills, NOT `"transparent"`
- `yield*` (with star) executes and waits; `yield` (no star) advances one frame
- Node properties are signals: `node.fill()` reads, `node.fill('red')` sets, `node.fill('red', 1)` tweens
- JSX creates real instances (no virtual DOM) — you can store them directly
- Install Lezer parsers for syntax highlighting: `npm i @lezer/javascript`, `lezer-r`, etc.
- `Txt` does not keep runs of spaces. Its default `textWrap` (`true`) behaves like CSS `white-space: pre-line`: line breaks stay, but spaces and tabs collapse to one, so aligned columns fall apart. `textWrap={false}` collapses the line breaks too. For aligned text, set `textWrap="pre"` on the `Txt` (like `pre-wrap`), or use a `Code` node with `highlighter={null}` (see "Plain text and line spacing").

## More detail

`references/api-guide.md` has the sections that only some scenes need: tweening and timing functions, the layout system and cardinal points, the `Code` component (setup, ranges, themes, reactive code), scene hierarchy, effects, filters, transitions between scenes, and polygon vertex positioning. Read the relevant section before using one of those features.

