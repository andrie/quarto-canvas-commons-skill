---
name: motion-canvas-api
description: Use when writing or debugging Canvas Commons (formerly Motion Canvas) animation code and you need to know which node, signal, tween or layout property to use.
---

# Canvas Commons (Motion Canvas) API reference (v0.4.0)

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds (`make cc-anim` where the project's own Makefile already had an `anim` target). If a project differs, say so before proceeding.

Import everything from the package roots, `@canvas-commons/core` and `@canvas-commons/2d`: the 0.4.0 packages have no `lib/...` deep imports. Older projects used the `@motion-canvas/*` scope (PORT-NOTE: deliberate mention of the old scope), and `@canvas-commons/editor` replaces the old `ui` package.

## Generated reference data (version 0.4.0, commit 2da1d4a)

Two files under `references/` are generated offline from the Canvas Commons source, so they list the real exported API rather than what this page remembers.

- `references/component-hierarchy.md`: the class tree, `Node > Layout > Shape > Curve > Rect` and so on, with each class's JSDoc summary. Read it to see which props a node inherits.
- `references/api-search-index.json`: 800+ exported classes, functions, types and enums from `core` and `2d`, each with `kind`, `package`, `signature`, `description`, class `members`, `examples` and example scenes, plus the synonym and purpose data. Query it with `node scripts/search-api.js Rect` (also takes `--limit 3`). It reads the committed index, so it needs only Node, no TypeScript. It matches exact names, aliases ("rectangle" or "box" finds Rect), prefixes, substrings, synonyms, purposes, member names and descriptions, and corrects typos ("retangle" finds Rect) by edit distance when few results match. It does no true subsequence matching: a short query such as `rct` only works when it is within one edit of a name.

Short keywords work best. A multi-word query is split into content words (in, a, the, of, one, another, along and similar are dropped) and each entry is ranked by how many words match, so partial matches still appear. Intent phrases lead to the real APIs, for example `node scripts/search-api.js "fade in one after another"` finds `chain` and `sequence`, and `node scripts/search-api.js "move along path"` finds `Curve` and its `getPointAtPercentage` member, with the signature printed. Matched member signatures are shown under the entry.

The timing and easing functions (`all`, `chain`, `sequence`, `delay`, `loop`, `waitFor`, `tween`, `linear`, `easeInOutCubic` and the rest) are all exported by `@canvas-commons/core`, not `@canvas-commons/2d`.

`references/api-reference.md` is a hand-written cheat sheet (common patterns, project layout, gotchas, worked Code, Polygon and 3D examples) that can lag the source. The two generated files above list what the source actually exports, so check them when the two disagree.

Members listed for a class are the ones it declares itself, not inherited ones: follow `extends` up the hierarchy for the rest. Several classes (Rect and Path among them) have no JSDoc in 0.4.0, so their description is empty.

Regenerating the two generated files is a maintainer task: see `references/regenerating.md`. Do not run it while writing scenes.

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

## Tweening

### Property tweens (preferred)
```typescript
// Basic — default easing is easeInOutCubic
yield* rect().fill('#ff0000', 1);

// Chain multiple
yield* rect().position.x(200, 1).to(-200, 1).to(0, 0.5);

// Custom timing function
yield* rect().position.x(200, 1, easeOutCubic);

// Custom interpolation
yield* rect().position(new Vector2(300, -200), 2, easeInOutCubic, Vector2.arcLerp);
```

### Available timing functions
`linear`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInExpo`, `easeOutExpo`, `easeInOutExpo`, and more. Default is `easeInOutCubic`.

### Low-level tween function
```typescript
yield* tween(2, value => {
  rect().position.x(map(-300, 300, easeInOutCubic(value)));
});
```

### Following a path

Curves (`Path`, `Line`, `Spline` and so on) expose `getPointAtPercentage(t)`, which returns a point with a `position`. Drive it from `tween` and apply easing to `t`:

```typescript
yield* tween(2, value => {
  dot().position(path().getPointAtPercentage(easeInOutCubic(value)).position);
});
```

### Interpolation helpers
- `map(from, to, value)` — linear number interpolation
- `Color.lerp(colorA, colorB, t)` — color interpolation
- `Vector2.arcLerp` — curved path interpolation

### Spring animations
```typescript
yield* spring(PlopSpring, -400, 400, 1, value => {
  rect().position.x(value);
});
// Presets: PlopSpring, SmoothSpring
// Custom: { mass, stiffness, damping, initialVelocity }
```

### Save / Restore
```typescript
rect().save();
yield* rect().position([300, -200], 2);
yield* rect().restore(1); // animate back to saved state
```

## Layout System

Flexbox-style positioning via the `layout` property.

```typescript
<Layout layout direction={'row'} gap={20} alignItems={'center'} justifyContent={'center'}>
  <Rect width={100} height={100} fill={'red'} />
  <Rect width={100} height={100} fill={'blue'} />
</Layout>
```

Properties: `layout`, `direction`, `gap`, `alignItems`, `justifyContent`, `padding`, `margin`, `size`, `anchor`.

### Cardinal Points

Edge/corner positions for connecting elements:

```typescript
// Edge positions
node().top()       node().bottom()
node().left()      node().right()

// Corner positions
node().topLeft()   node().topRight()
node().bottomLeft() node().bottomRight()

// Use for connecting lines
<Line points={[
  () => nodeA().right(),
  () => nodeB().left(),
]} />

// Positioning relative to edges
<Rect right={otherRect().left()} />
```

## Code Component

### Setup
```typescript
import {Code, LezerHighlighter} from '@canvas-commons/2d';
import {parser} from '@lezer/javascript';

// Set default highlighter in project file
Code.defaultHighlighter = new LezerHighlighter(
  parser.configure({ dialect: 'jsx ts' })
);
```

### Display and animate
```typescript
const code = createRef<Code>();
<Code ref={code} fontSize={28} fontFamily="'JetBrains Mono', monospace"
      code={'const x = 1;'} />

// Diff animation (auto-detects changes)
yield* code().code('const x = 2;', 0.6);

// Append / prepend
yield* code().code.append('\nconst y = 2;', 0.6);
yield* code().code.prepend('// header\n', 0.6);

// Insert at position
yield* code().code.insert([2, 0], '  return;\n', 0.6);

// Replace range
yield* code().code.replace(word(1, 6, 5), 'newName', 0.6);

// Remove range
yield* code().code.remove(lines(2), 0.6);

// Selection highlight
yield* code().selection(code().findFirstRange('variable'), 0.6);
yield* code().selection(lines(1, 3), 0.6);
yield* code().selection(DEFAULT, 0.6); // reset
```

### Code ranges
```typescript
word(line, column, length)  // range within a line
lines(startLine, endLine)   // full line range
lines(singleLine)           // single line
code().findFirstRange('text')  // find by string
code().findAllRanges(/regex/gi) // find by regex
```

### Custom themes
```typescript
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';

const MyStyle = HighlightStyle.define([
  {tag: tags.keyword, color: '#ff6470'},
  {tag: tags.string, color: '#99C47A'},
  {tag: tags.comment, color: '#808586'},
  {tag: tags.function(tags.variableName), color: '#ffc66d'},
  {tag: tags.variableName, color: '#EE6331'},
  {tag: tags.number, color: '#68ABDF'},
  {tag: tags.operator, color: '#419599'},
  {tag: tags.punctuation, color: '#ACB3BF'},
]);

Code.defaultHighlighter = new LezerHighlighter(parser, MyStyle);
```

### Plain text and line spacing

For preformatted text that is not code (terminal output, tables, aligned columns), use a `Code` node with `highlighter={null}`. It keeps every space and line break, and the `null` stops a project-wide `Code.defaultHighlighter` from colouring it; the text takes the node's `fill`. `Code` also takes `lineHeight` (inherited from `Layout`, in px or a percentage such as `'150%'`), which spaces the lines and lets separately drawn line numbers line up:

```tsx
<Code highlighter={null} anchor={[-1, -1]} position={[-800, 100]}
      fontFamily="monospace" fontSize={22} lineHeight={32} fill="#CCCCCC"
      code={`species    mass\nAdelie     3700.7\nChinstrap  3733.1`} />
```

### Reactive code with signals
```typescript
import {CODE} from '@canvas-commons/2d';

const name = Code.createSignal('hello');
<Code code={CODE`function ${name}() {}`} />
yield* name('goodbye', 0.6); // animates the code change
```

## Scene Hierarchy

```typescript
// Add nodes
view.add(<Rect />);
view.add(<>{node1}{node2}</>);

// Modify at runtime
parent().add(<Circle />);
node().remove();
node().reparent(newParent);

// Query descendants
const texts = view.findAll(is(Txt));
const first = view.findFirst(is(Circle));
```

## Effects

```typescript
// Immediate — runs when any dependency changes
createEffect(() => {
  console.log(signal());
});

// Deferred — batched to end of frame
createDeferredEffect(() => {
  label().text(`Value: ${signal()}`);
});
```

## Filters

```typescript
// Property-style
yield* node().filters.blur(10, 1);
yield* node().filters.brightness(1.5, 1);

// Array-style
<Node filters={[blur(blurSignal)]} />

// Composite operations (masking) — requires cache
<Node cache>
  <Circle compositeOperation={'source-in'} />
</Node>
```

## Transitions (between scenes)

```typescript
// Pre-made (yield at start of new scene)
yield* slideTransition(Direction.Left, 0.6);
yield* fadeTransition(0.6);
yield* zoomInTransition();
yield* zoomOutTransition();

// Trigger transition before scene ends
finishScene();
yield* remainingAnimation();
```

## Polygon Vertex Positioning

Critical for triangles and other polygons — the visual polygon is inscribed in the bounding ellipse, so use `vertex()` for exact positions:

```typescript
const tri = createRef<Polygon>();
<Polygon ref={tri} sides={3} size={[400, 400]} />

// Vertex indices for triangle:
// 0 = top, 1 = bottom-right, 2 = bottom-left
const topPos = tri().vertex(0);
const bottomRight = tri().vertex(1);
const bottomLeft = tri().vertex(2);

// Position text relative to vertices
<Txt position={() => [tri().vertex(0).x, tri().vertex(0).y - 50]} />
```

## Important Gotchas

- Use `"rgba(0,0,0,0)"` for transparent fills, NOT `"transparent"`
- `yield*` (with star) executes and waits; `yield` (no star) advances one frame
- Node properties are signals: `node.fill()` reads, `node.fill('red')` sets, `node.fill('red', 1)` tweens
- JSX creates real instances (no virtual DOM) — you can store them directly
- Install Lezer parsers for syntax highlighting: `npm i @lezer/javascript`, `lezer-r`, etc.
- `Txt` does not keep runs of spaces. Its default `textWrap` (`true`) behaves like CSS `white-space: pre-line`: line breaks stay, but spaces and tabs collapse to one, so aligned columns fall apart. `textWrap={false}` collapses the line breaks too. For aligned text, set `textWrap="pre"` on the `Txt` (like `pre-wrap`), or use a `Code` node with `highlighter={null}` (see "Plain text and line spacing").
