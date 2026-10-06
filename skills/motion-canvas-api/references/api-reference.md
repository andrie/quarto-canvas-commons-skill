### Canvas Commons (Motion Canvas) documentation - version 0.4.0

> Regenerate the sibling files `api-search-index.json` and `component-hierarchy.md` only when Canvas Commons ships an API-affecting version. Current data is for 0.4.0 (see SKILL.md).

#### Core APIs and Components

##### Scene Creation
```typescript
import {makeScene2D} from '@canvas-commons/2d';
import {createRef} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  // Scene logic here
});
```

##### Node Types
- **Rect**: Rectangles with fills, strokes, rounded corners
- **Circle**: Circles and ellipses
- **Txt**: Text with fonts, sizes, colors, alignment
- **Img**: Images and sprites
- **Line**: Lines and paths
- **Layout**: Container for flexbox-style layouts
- **Node**: Base class for all visual elements

##### Animation Methods
- `yield*` - Execute animations sequentially
- `tween(duration, callback)` - Create smooth transitions
- `waitFor(seconds)` - Add timing delays
- `all(...animations)` - Run animations in parallel
- `chain(...animations)` - Run animations sequentially

##### Signal System
- Reactive values that automatically update dependents
- `createSignal(initialValue)` - Create reactive state
- `node.position()` - Get current value
- `node.position(newValue)` - Set new value
- `node.position.to(target, duration)` - Animate to target

##### Layout System
- Flexbox-style positioning
- `justifyContent`, `alignItems`, `direction`, `gap`
- `size`, `margin`, `padding`
- Relative positioning with `position.x()`, `position.y()`

**Layout Component Usage:**
The `<Layout>` component is a container that automatically organizes and positions its child elements in a structured hierarchy.

```typescript
import {Layout, Txt, Rect} from '@canvas-commons/2d';

<Layout layout gap={20} alignItems={'center'}>
  <Txt fill={'white'}>Example</Txt>
  <Rect fill={'#f3303f'} padding={20}>
    <Txt>Child content</Txt>
  </Rect>
</Layout>
```

**Key Layout Properties:**
- `layout` - Enables layout mode
- `gap={number}` - Spacing between child elements
- `alignItems={'center' | 'start' | 'end'}` - Vertical alignment
- `direction={'row' | 'column'}` - Layout direction (default: column)

**Layout Benefits:**
1. **Automatic positioning** - No need to manually calculate positions
2. **Consistent spacing** - `gap` property handles uniform spacing
3. **Responsive alignment** - Children automatically align based on container
4. **Hierarchical organization** - Creates clean parent-child relationships

**Practical Example:**
Instead of manually positioning elements separately:
```typescript
// Instead of this:
<Rect ref={appBox} position={[450, -100]} />
<Txt ref={appText} position={[450, -100]} />

// Use Layout:
<Layout position={[450, -100]} alignItems={'center'}>
  <Rect ref={appBox} width={270} height={135} />
  <Txt ref={appText}>App</Txt>
</Layout>
```

This automatically centers the text within the box and keeps them grouped together as a single unit.

#### Common Patterns

##### Basic Animation Setup
```typescript
const rect = createRef<Rect>();

view.add(
  <Rect
    ref={rect}
    width={100}
    height={100}
    fill="#ff0000"
    position={[0, 0]}
  />
);

yield* rect().scale(2, 1);
```

##### Sequential Animations
```typescript
yield* rect().position.x(200, 1);
yield* rect().rotation(90, 0.5);
yield* rect().opacity(0, 1);
```

##### Parallel Animations
```typescript
yield* all(
  rect().position.x(200, 1),
  rect().rotation(90, 1),
  rect().scale(1.5, 1)
);
```

##### Text Animations
```typescript
const text = createRef<Txt>();

view.add(
  <Txt
    ref={text}
    fontSize={48}
    fontFamily="Arial"
    fill="#ffffff"
    text="Hello World"
  />
);

yield* text().text("Animated Text", 1);
```

#### Project Structure
- `/animations/src/` - Motion Canvas source files
- `/animations/src/scenes/` - Individual scene files
- `/animations/src/project.ts` - Project configuration
- `/animations/vite.config.ts` - Build configuration

#### Build Commands
- `npm run serve` - Start development server with live preview
- `npm run build` - Build/export animations to video
- `make serve` - Alternative via Makefile
- `make anim` - Build animations via Makefile

#### Creating a New Scene

To add a new scene to the project, follow these steps:

1. **Create the scene file**: Create `animations/src/scenes/scene-name.tsx`
   - Contains the actual animation logic using `makeScene2D()`
   - Uses Motion Canvas components (Rect, Txt, Circle, etc.)

2. **Create the project file**: Create `animations/src/scene-name.ts`
   - Defines the Motion Canvas project configuration
   - Imports and references the scene file

3. **Update vite.config.ts**: Add the project file to the project array
   - Add `"./src/scene-name.ts"` to the `project` array in `motionCanvas()` plugin

**Example Scene Structure:**
```typescript
// animations/src/scenes/example.tsx
import {makeScene2D} from '@canvas-commons/2d';
import {Rect, Txt} from '@canvas-commons/2d';
import {createRef} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();

  view.add(
    <Rect ref={rect} width={100} height={100} fill="#ff0000" />
  );

  yield* rect().scale(2, 1);
});
```

**Example Project File:**
```typescript
// animations/src/example.ts
import {makeProject} from '@canvas-commons/core';
import scene from './scenes/example?scene';

export default makeProject({
  scenes: [scene],
});
```

#### InfoSec Animation Context
This project creates animations for a security presentation. Consider:
- Security-themed colors (red, orange, green for alerts/status)
- Network diagrams and data flow visualizations
- Code snippets and terminal outputs
- Timeline animations for attack scenarios
- Interactive elements showing security concepts

#### Type Definitions
The project has full TypeScript support with rich type definitions available in:
- `node_modules/@canvas-commons/core/` - Core animation types and interfaces
- `node_modules/@canvas-commons/2d/` - 2D rendering components and nodes
- `node_modules/@canvas-commons/editor/` - UI components for the editor

These type definitions contain comprehensive API documentation accessible through IDE IntelliSense, including:
- Method signatures and parameters
- Property types and valid values
- JSDoc comments with usage examples
- Interface definitions for all Motion Canvas objects

#### Cardinal Points and Edge Positioning

Motion Canvas provides powerful edge positioning for connecting elements:

**Edge Position Properties (available on Layout components):**
```typescript
// Edge positions
readonly top: SimpleVector2Signal<this>;
readonly bottom: SimpleVector2Signal<this>;
readonly left: SimpleVector2Signal<this>;
readonly right: SimpleVector2Signal<this>;

// Corner positions
readonly topLeft: SimpleVector2Signal<this>;
readonly topRight: SimpleVector2Signal<this>;
readonly bottomLeft: SimpleVector2Signal<this>;
readonly bottomRight: SimpleVector2Signal<this>;
```

**Connecting Lines Using Cardinal Points:**
```typescript
// Connect from right edge of element1 to left edge of element2
<Line
  points={[
    () => element1().right(),  // Right edge of first element
    () => element2().left()    // Left edge of second element
  ]}
  stroke="#447099"
  lineWidth={4.5}
  startArrow
  endArrow
/>
```

**Alternative using cardinalPoint() method:**
```typescript
import { Direction } from '@canvas-commons/core';

<Line
  points={[
    () => element1().cardinalPoint(Direction.Right),
    () => element2().cardinalPoint(Direction.Left)
  ]}
/>
```

**Available Direction/Origin enums:**
- `Direction.Top`, `Direction.Bottom`, `Direction.Left`, `Direction.Right`
- `Origin.Middle`, `Origin.TopLeft`, `Origin.TopRight`, etc.

#### Color and Transparency
- Use `"rgba(0,0,0,0)"` for transparent fills (not `"transparent"`)
- Motion Canvas doesn't support CSS-style `"transparent"` keyword

#### Database and 3D Shape Visualization

**3D Database Cylinder:**
To create a professional database symbol using wireframe style:
```typescript
{/* Top ellipse (full) */}
<Circle
  ref={dbTopEllipse}
  width={90}
  height={20}
  fill="rgba(0,0,0,0)"
  stroke={Posit.blue}
  lineWidth={4.5}
  position={[450, 120]}
/>

{/* Bottom ellipse (partial - only front arc visible) */}
<Circle
  ref={dbBottomEllipse}
  width={90}
  height={20}
  fill="rgba(0,0,0,0)"
  stroke={Posit.blue}
  lineWidth={4.5}
  position={[450, 180]}
  startAngle={0}
  endAngle={180}
/>

{/* Vertical lines connecting the ellipses */}
<Line
  points={[[405, 120], [405, 180]]}
  stroke={Posit.blue}
  lineWidth={4.5}
/>
<Line
  points={[[495, 120], [495, 180]]}
  stroke={Posit.blue}
  lineWidth={4.5}
/>
```

**Key Techniques:**
- Use `Circle` with different `width` and `height` to create ellipses
- Full ellipse for top face (visible from above)
- Partial ellipse for bottom face using `startAngle={0}` and `endAngle={180}`
- Vertical `Line` elements for cylinder sides
- Transparent fills with visible strokes for wireframe effect

#### Code Component and Syntax Highlighting

Motion Canvas provides a dedicated `Code` component for displaying code with syntax highlighting:

**Basic Usage:**
```typescript
import {Code, LezerHighlighter} from '@canvas-commons/2d';
import {parser} from '@lezer/javascript';

<Code
  code={`const hello = "world";`}
  fontSize={24}
  fontFamily="'JetBrains Mono', monospace"
/>
```

**With Custom Highlighter:**
```typescript
<Code
  highlighter={new LezerHighlighter(parser)}
  code={codeString}
  fontSize={24}
  position={[0, 0]}
  width={800}
/>
```

**Highlighter Configuration:**
- **LezerHighlighter**: Uses Lezer parsers for syntax highlighting
- **Official parsers**: `@lezer/javascript`, `@lezer/python`, `@lezer/rust`, etc.
- **Community parsers**: `lezer-r` for R language support
- **Default highlighter**: Can be set globally with `Code.defaultHighlighter`

**Language-specific Setup:**
```typescript
// JavaScript/TypeScript with dialects
import {parser as jsParser} from '@lezer/javascript';
Code.defaultHighlighter = new LezerHighlighter(
  jsParser.configure({
    dialect: 'jsx ts' // Enable JSX and TypeScript
  })
);

// R language syntax highlighting
import {parser as rParser} from 'lezer-r';
<Code
  highlighter={new LezerHighlighter(rParser)}
  code={rCode}
/>
```

**Custom Themes:**
```typescript
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';

const customStyle = HighlightStyle.define([
  {tag: tags.keyword, color: '#ff6470'},
  {tag: tags.string, color: '#99C47A'},
  {tag: tags.comment, color: '#808586'}
]);

const highlighter = new LezerHighlighter(parser, customStyle);
```

**Creating Brand-Consistent Themes:**
```typescript
// Using Posit brand colors for syntax highlighting
import {Posit, Colors} from '../styles';

const positStyle = HighlightStyle.define([
  { tag: tags.keyword, color: Colors.KEYWORD },        // Pink/red (#ff6470)
  { tag: tags.string, color: Colors.STRING },          // Green (#99C47A)
  { tag: tags.comment, color: Colors.COMMENT },        // Gray (#808586)
  { tag: tags.function(tags.variableName), color: Colors.FUNCTION }, // Yellow (#ffc66d)
  { tag: tags.variableName, color: Posit.orange },     // Orange (#EE6331)
  { tag: tags.literal, color: Colors.NUMBER },         // Blue (#68ABDF)
  { tag: tags.operator, color: Posit.teal },           // Teal (#419599)
  { tag: tags.punctuation, color: Colors.TEXT },       // Light gray (#ACB3BF)
]);
```

**GitHub-Style Dark Theme:**
```typescript
const githubDarkStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff7b72' },        // Light red
  { tag: tags.string, color: '#a5d6ff' },         // Light blue
  { tag: tags.comment, color: '#8b949e' },        // Medium gray
  { tag: tags.function(tags.variableName), color: '#d2a8ff' }, // Light purple
  { tag: tags.variableName, color: '#ffa657' },   // Light orange
  { tag: tags.literal, color: '#79c0ff' },        // Light cyan
  { tag: tags.operator, color: '#ff7b72' },       // Light red
  { tag: tags.punctuation, color: '#e6edf3' },    // Light white
]);
```

**Custom Parser-Based Highlighters:**

When community parsers like `lezer-r` don't provide comprehensive semantic highlighting, you can create a custom highlighter that maps parser node types directly to colors:

```typescript
import { Parser, Tree } from '@lezer/common';
import { CodeHighlighter, HighlightResult } from '@canvas-commons/2d';

export class RHighlighter implements CodeHighlighter<RCache | null> {
  private readonly parser: Parser;
  private readonly colors: Record<string, string>;

  constructor(parser: Parser, colors: Record<string, string>) {
    this.parser = parser;
    this.colors = colors;
  }

  private walkTree(node: any, code: string, colorLookup: Map<string, string>) {
    let color: string | null = null;

    switch (node.name) {
      case 'Identifier':
        if (node.parent && node.parent.name === 'FunctionCall') {
          color = this.colors.function;
        } else {
          color = this.colors.identifier;
        }
        break;
      case 'function':
        color = this.colors.keyword;
        break;
      case 'String':
        color = this.colors.string;
        break;
      case 'AssignmentOperator':
        color = this.colors.operator;
        break;
      // Add more cases as needed
    }

    // Only color terminal nodes to avoid container nodes overriding children
    if (color && !node.firstChild) {
      colorLookup.set(`${node.from}-${node.to}`, color);
    }

    // Recurse to children
    let child = node.firstChild;
    while (child) {
      this.walkTree(child, code, colorLookup);
      child = child.nextSibling;
    }
  }
}
```

**Usage with Custom Highlighter:**
```typescript
import { RHighlighter } from '../components/RHighlighter';

const rHighlighter = new RHighlighter(parser, {
  default: Colors.TEXT,           // Base text color
  identifier: Posit.orange,       // Variable names
  function: Colors.FUNCTION,      // Function names
  keyword: Colors.KEYWORD,        // Keywords
  string: Colors.STRING,          // Strings
  operator: Posit.teal,          // Operators
});

<Code
  highlighter={rHighlighter}
  code={rCode}
  fill={Colors.TEXT}  // Fallback color for untagged text
/>
```

**Key Benefits of Custom Highlighters:**
- **Direct node mapping**: Works with any Lezer parser regardless of semantic highlighting support
- **Complete control**: Define exactly which syntax elements get which colors
- **Performance**: More efficient than semantic highlighting for simple use cases
- **Debugging friendly**: Easy to see what parser nodes exist and how they map to colors

**Code Component Properties:**
- `code`: The code string to display
- `highlighter`: Syntax highlighter instance
- `fontSize`: Text size
- `fontFamily`: Font (JetBrains Mono recommended)
- `width`: Container width for wrapping
- `anchorX/anchorY`: Text alignment adjustments (named `offsetX/offsetY` before 0.4.0)

**Animation Capabilities:**
```typescript
// Animate code changes
yield* codeRef().code(`new code content`, duration);

// Line-by-line reveals using selection
yield* codeRef().selection(lines(0, 5), duration);
```

#### Polygon Component Geometry and Positioning

**Understanding Inscribed Polygon Behavior:**
The Motion Canvas `Polygon` component creates regular polygons inscribed within an ellipse defined by the `size` property. This has important implications for triangles and other low-sided polygons.

**Key Insights from Source Code Analysis:**
```typescript
// From Polygon.ts vertex() method:
public vertex(index: number): Vector2 {
  const size = this.computedSize().scale(0.5);
  const theta = (index * 2 * Math.PI) / this.sides();
  const direction = Vector2.fromRadians(theta).perpendicular;
  return direction.mul(size);
}
```

**Critical Understanding:**
1. **Inscribed Circle/Ellipse**: Polygons are inscribed in the ellipse defined by width/height
2. **Actual Size Difference**: The visual polygon is smaller than the bounding box
3. **Triangle Specifics**: For triangles, this difference is particularly noticeable

**Triangle Positioning Using vertex() Method:**
The best approach for positioning elements around polygons is to use the `vertex()` method, which returns the exact coordinates of each polygon vertex:

```typescript
// Get exact vertex positions - no manual calculations needed
const vertex0 = triangle().vertex(0); // Top vertex
const vertex1 = triangle().vertex(1); // Bottom right vertex
const vertex2 = triangle().vertex(2); // Bottom left vertex
```

**Positioning Text Around Triangles:**
Use the `vertex()` method for precise positioning relative to actual triangle vertices:

```typescript
// ❌ Wrong - uses bounding box or manual geometry calculations
position={() => [triangle().bottomLeft().x, triangle().bottomLeft().y + 50]}
position={() => [triangle().position.x(), triangle().position.y() + calculatedBottom + 50]}

// ✅ Correct - uses actual vertex positions
const textSpacing = 100;

// Position above top vertex (vertex 0)
position={() => [
  triangle().vertex(0).x,
  triangle().vertex(0).y - textSpacing
]}

// Position below bottom left vertex (vertex 2)
position={() => [
  triangle().vertex(2).x,
  triangle().vertex(2).y + textSpacing
]}

// Position below bottom right vertex (vertex 1)
position={() => [
  triangle().vertex(1).x,
  triangle().vertex(1).y + textSpacing
]}
```

**Triangle Vertex Indexing:**
For a standard triangle (3 sides), vertices are indexed as:
- **Vertex 0**: Top point
- **Vertex 1**: Bottom right point
- **Vertex 2**: Bottom left point

**Best Practices:**
1. **Use `vertex()` method** instead of manual geometry calculations
2. **Use fixed spacing values** instead of percentage-based positioning for text
3. **Test with different polygon sizes** to ensure positioning remains consistent
4. **Consider rotation effects** - `vertex()` automatically accounts for rotation

**Example Implementation:**
```typescript
// InfoSec triad triangle with vertex-based positioning
const textSpacing = 100;

<Polygon ref={triangleRef} sides={3} size={[width, height]} />

<Txt
  text="Confidentiality"
  position={() => [
    triangleRef().vertex(0).x,
    triangleRef().vertex(0).y - textSpacing
  ]}
/>

<Txt
  text="Integrity"
  position={() => [
    triangleRef().vertex(2).x,
    triangleRef().vertex(2).y + textSpacing
  ]}
/>

<Txt
  text="Availability"
  position={() => [
    triangleRef().vertex(1).x,
    triangleRef().vertex(1).y + textSpacing
  ]}
/>
```

This approach ensures text remains properly positioned relative to the visual triangle edges rather than the invisible bounding box.

#### Common Issues
- Ensure proper TypeScript setup in `tsconfig.json`
- Use `createRef()` for accessing node properties after creation
- Remember `yield*` for sequential animations
- Motion Canvas uses its own coordinate system (center origin)
- Use cardinal points for dynamic element connections
- Transparent fills must use RGBA format, not CSS keywords
- Install appropriate Lezer parser packages for syntax highlighting (`npm i @lezer/javascript`)
- For R language support, install the community parser: `npm i lezer-r`
- TypeScript may show implicit 'any' warnings for community parsers like `lezer-r` - this is expected behavior
- **Polygon positioning**: Remember that polygons are inscribed in their bounding ellipse - calculate actual geometry for precise positioning