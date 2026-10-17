# Scene patterns by kind

Proven patterns for diagrams, grids, geometric scenes, logos and code display. Pick the kind that matches the scene you are building.

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
<Database ref={databaseLeft} position={[0, 250]} opacity={0} />  // from '../lib/components/Database'

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

`RHighlighter` is not in a fresh project. Copy it in by following the `motion-canvas-r-code` skill's setup steps first.

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

### Terminal output and aligned text

`Txt` collapses runs of spaces, so console output, tables and aligned columns need a `Code` node with `highlighter={null}` (or `Txt` with `textWrap="pre"`). The `motion-canvas-api` skill's "Plain text and line spacing" has the example, including `lineHeight` for matching line numbers.

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
