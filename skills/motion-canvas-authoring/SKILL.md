---
name: motion-canvas-authoring
description: Use when composing Canvas Commons (formerly Motion Canvas) components into an animated scene for a presentation and you want proven layout, timing and style patterns.
---

# Motion Canvas Scene Authoring Patterns

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

Before writing a scene, read `animations/src/styles.ts` for current color and font values. Use the `Posit` and `Colors` objects rather than hardcoding hex values.

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

## Diagram / Architecture Scenes

For flowcharts, system diagrams, and architecture visuals (like User → App → LLM → Database).

### Labeled box pattern
Use `<Layout>` wrapping `<Rect>` + `<Txt>` to keep text auto-centered in a box:

```typescript
<Layout
  ref={appLayout}
  position={[425, -100]}
  size={[270, 135]}
  alignItems={'center'}
  justifyContent={'center'}
>
  <Rect
    width={270}
    height={135}
    fill="rgba(0,0,0,0)"
    stroke={Posit.blue}
    lineWidth={6.75}
  />
  <Txt
    fontSize={63}
    fontFamily="Helvetica"
    fill={Posit.blue}
    text="App"
  />
</Layout>
```

### Plain text labels (no box)
For elements like "User" that don't need a border:

```typescript
<Txt
  ref={userText}
  fontSize={63}
  fontFamily="Helvetica"
  fill={Posit.blue}
  text="User"
  position={[100, -100]}
/>
```

### Connection lines with cardinal points
Use reactive arrow functions so lines follow elements if they move:

```typescript
<Line
  ref={userToApp}
  points={[
    () => userText().right(),   // right edge of source
    () => appLayout().left()    // left edge of target
  ]}
  stroke={Posit.blue}
  lineWidth={4.5}
  startArrow
  endArrow
  arrowSize={18}
/>
```

### Multi-point routing for branching paths

```typescript
<Line
  ref={appToLeftDb}
  points={[
    () => {
      const appBottom = appLayout().bottom();
      const centerTop = databaseCenter().top();
      return [(appBottom.x + centerTop.x) / 2, (appBottom.y + centerTop.y) / 2];
    },
    () => [databaseLeft().top().x, midpointY],
    () => databaseLeft().top()
  ]}
  stroke={Posit.blue}
  lineWidth={4.5}
  endArrow
  arrowSize={18}
/>
```

### Progressive reveal animation
Elements that appear later start hidden and animate in:

```typescript
// In JSX: set initial state
<Database ref={databaseLeft} position={[0, 250]} opacity={0} />

// In animation: reveal with movement
yield* all(
  databaseLeft().opacity(1, 2),
  databaseLeft().position([-300, 250], 2),
  appToLeftDb().opacity(1, 2),
);
```

### Consistent proportions
- Box lineWidth: **6.75**
- Connection lineWidth: **4.5**
- Arrow size: **18**
- Label fontSize: **63**
- Font: **"Helvetica"** for diagram labels

## Grid / Pattern Scenes

For decorative backgrounds and tiled patterns (hexagons, dot grids).

### Helper function for repeated elements

```typescript
function gridPoly(ref: any, x: number, y: number, size: number, opacity: number) {
  return (
    <Polygon
      ref={ref}
      x={x} y={y}
      size={size}
      fill={Posit.gray}
      lineWidth={3}
      stroke={Colors.almostBlack}
      scale={0}
      opacity={opacity}
    />
  );
}
```

### 2D grid layout with array refs

```typescript
const polys: Polygon[] = [];

view.add(
  <>
    {Array.from({ length: nrows }, (_, i) =>
      Array.from({ length: ncols }, (_, j) =>
        gridPoly(
          makeRef(polys, i * ncols + j),
          (j - ncols / 2) * size * cos(30) + (i % 2) * size * cos(30) / 2,
          -size * i * 1.5 * sin(30) + (nrows + 2) * size * sin(30) / 2,
          size,
          (1 - i / nrows) * 0.5
        )
      ))
    }
  </>
);
```

### Staggered animation across many elements

```typescript
yield* all(
  sequence(0.01, ...polys.map(poly => poly.scale(1, 2))),
  chain(
    waitFor(1),
    sequence(0.01, ...polys.map((poly, index) => {
      const opacity = (1 - index / polys.length) * 0.8;
      return all(
        poly.fill(Posit.teal, 2),
        poly.opacity(opacity, 2),
      );
    })),
  ),
);
```

## Geometric / Conceptual Scenes

For abstract concepts like the CIA triad triangle.

### Responsive sizing

```typescript
const sceneHeight = view.height() * 0.7;
const sceneWidth = view.width() * 0.7;
const desiredHeight = sceneHeight * 0.6;
```

### Polygon with vertex-based text positioning

```typescript
const triangleRef = createRef<Polygon>();
<Polygon ref={triangleRef} sides={3} size={[width, height]}
         stroke={Posit.blue} lineWidth={15} fill="rgba(0,0,0,0)" />

// Position text at exact vertices
<Txt position={() => [
  triangleRef().vertex(0).x,
  triangleRef().vertex(0).y - textSpacing
]} />
```

### Grouping with Node container

```typescript
<Node ref={diagramContainer} position={[0, 100]}>
  <Polygon ... />
  <Txt ... />
  <Txt ... />
</Node>
```

## Logo / Path Scenes

For brand animations and shape morphing.

### SVG path animation

```typescript
<Path ref={chevron} stroke='#666' lineWidth={5} data={rectPath} />

// Morph to new shape
yield* chevron().data(newShapePath, 1);
```

### Multi-stage chain animation

```typescript
yield* chain(
  waitFor(1),
  all(shape1().data(newPath, 1), shape2().data(newPath, 1)),  // morph
  all(shape1().position.x(-100, 1), shape2().position.x(100, 1)),  // reposition
  all(shape1().stroke('#e13238', 2), shape2().stroke('#33c', 2)),  // recolor
  all(container().position([875, 425], 1), container().scale(0.5, 1)),  // shrink
);
```

## Code Display Scenes

### R syntax highlighting with custom highlighter

```typescript
import {RHighlighter} from '../components/RHighlighter';
import {parser} from 'lezer-r';

const rHighlighter = new RHighlighter(parser, {
  default: Colors.TEXT,
  identifier: Posit.orange,
  function: Colors.FUNCTION,
  keyword: Colors.KEYWORD,
  string: Colors.STRING,
  comment: Colors.COMMENT,
  operator: Posit.teal,
  number: Colors.NUMBER,
});

<Code ref={codeComponent} highlighter={rHighlighter} code={rCode}
      fontSize={24} fontFamily="'JetBrains Mono', 'Fira Code', monospace"
      fill={Colors.TEXT} position={[-800, 50]} width={850} />
```

### Line-by-line code reveal

```typescript
yield* codeComponent().code('', 0); // start empty
const lines = rCode.split('\n');
let currentCode = '';
for (let i = 0; i < lines.length; i++) {
  currentCode += (i > 0 ? '\n' : '') + lines[i];
  yield* codeComponent().code(currentCode, 0.2);
}
```

## Custom Component Pattern

Extend Layout for reusable animated components:

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

## Reusable Animation Utilities

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
- **Colors**: always from `Posit` and `Colors` objects — read `animations/src/styles.ts`
- **Consistent proportions**: maintain lineWidth ratios across related elements in a scene
