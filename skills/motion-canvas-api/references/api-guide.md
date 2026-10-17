# API guide: tweening, layout, code, effects and polygons

Sections moved out of `SKILL.md` because they are only needed for specific tasks. Read the one that matches what you are building.

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
