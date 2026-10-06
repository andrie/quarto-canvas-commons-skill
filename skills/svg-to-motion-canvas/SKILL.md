---
name: svg-to-motion-canvas
description: Use when translating a draw.io or SVG diagram into an animated Canvas Commons (formerly Motion Canvas) scene.
---

# SVG to Motion Canvas Translation

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

A proven workflow for creating animated diagram scenes: design the static layout in draw.io, export as SVG, then translate to an animated Motion Canvas scene.

## Translation Process

1. **Read the SVG** — identify all visual elements (shapes, text, connections, special shapes like databases)
2. **Map elements** — convert each SVG element to its Motion Canvas equivalent
3. **Scale coordinates** — transform from SVG coordinate space to 1920x1080 canvas
4. **Apply styles** — map SVG colors/fonts to project style constants
5. **Add animation** — design a progressive reveal sequence (not in the SVG)

## Element Mapping

| SVG element | Motion Canvas equivalent |
|-------------|------------------------|
| `<rect>` with stroke, no fill, containing `<text>` | `<Layout>` wrapping `<Rect fill="rgba(0,0,0,0)" stroke={Posit.blue} lineWidth={6.75}>` + `<Txt fontSize={63}>` |
| `<rect>` with no stroke (text-only label) | Plain `<Txt>` node |
| Arrow `<path>` between elements | `<Line points={[() => source().right(), () => target().left()]} startArrow endArrow arrowSize={18}>` |
| Database cylinder (curved `<path>` elements) | `<Database>` custom component from `../components/Database` |
| Triangle/polygon `<path>` | `<Polygon sides={n}>` with `vertex()` for text positioning |
| Branching/routed arrow paths | Multi-point `<Line>` with computed midpoints via arrow functions |
| Plain `<text>` | `<Txt>` node |
| `<circle>` or `<ellipse>` | `<Circle>` |

### Key insight: prefer semantic Motion Canvas components over raw SVG translation
- Don't try to replicate exact SVG path data — use Motion Canvas primitives (Rect, Circle, Polygon, Line)
- Use cardinal points (`right()`, `left()`, `top()`, `bottom()`) for connections instead of hardcoded coordinates
- Use `<Layout>` for text-in-box instead of separate rect+text with manual positioning

## Coordinate Translation

SVG and Motion Canvas have different coordinate systems:

| | SVG | Motion Canvas |
|-|-----|---------------|
| Origin | Top-left | Center |
| Y direction | Down | Down |
| Typical size | Small (e.g., 280x93 viewBox) | 1920x1080 |

### Scaling formula

```
scale = min(1920 / svg_width, 1080 / svg_height) * 0.7
mc_x = (svg_x - svg_width / 2) * scale
mc_y = (svg_y - svg_height / 2) * scale
```

The 0.7 factor leaves margins around the diagram.

### Practical approach

Rather than computing exact coordinates, use the SVG as a **relative layout guide**:
- Note which elements are left/center/right and top/middle/bottom
- Space elements evenly in Motion Canvas coordinates
- Use cardinal points for connections so exact positions don't matter

## Style Translation

| SVG property | Motion Canvas equivalent |
|-------------|------------------------|
| `stroke="#447099"` | `stroke={Posit.blue}` — always use style constants |
| `stroke-width="3"` | `lineWidth={6.75}` — scale proportionally |
| `font-size="14px"` | `fontSize={63}` — scale proportionally |
| `font-family="Helvetica"` | `fontFamily="Helvetica"` — keep same |
| `fill="none"` | `fill="rgba(0,0,0,0)"` — never use `"transparent"` |
| `fill="#447099"` | `fill={Posit.blue}` — map to constants |

Always read `animations/src/styles.ts` for current color values. Map SVG hex colors to the nearest `Posit` or `Colors` constant rather than hardcoding.

## Animation Strategy

The SVG is a static layout — you design the animation reveal:

### Progressive reveal (most common)

1. All elements start visible OR key elements start at `opacity={0}`
2. Primary elements appear first (main boxes, central shape)
3. Connections draw after their endpoints are visible
4. Secondary elements animate in (additional databases, labels)
5. Text labels fade in last

### Example animation sequence

```typescript
// Wait to show initial layout
yield* waitFor(1);

// Animate secondary elements appearing with movement
yield* all(
  element().opacity(1, 2),
  element().position(targetPos, 2),
  connectionLine().opacity(1, 2),
);

yield* waitFor(0.5);

// Animate another group
yield* all(
  element2().opacity(1, 2),
  element2().position(targetPos2, 2),
  connectionLine2().opacity(1, 2),
);
```

### Animation timing guidelines
- Element appear: **1-2 seconds**
- Fade-in: **1-2 seconds**
- Wait between groups: **0.5-1 seconds**
- Total scene duration: **5-15 seconds** for typical diagrams

## Proven examples

Three translated diagrams and four stand-alone scenes are described in `references/worked-examples.md`, with the files under `seed/`.

## Checklist for SVG Translation

1. [ ] Read the SVG and list all elements
2. [ ] Map each element to a Motion Canvas component
3. [ ] Read `animations/src/styles.ts` for current colors
4. [ ] Check if custom components exist (`Database`, etc.) before building from scratch
5. [ ] Create scene file, project file, register in vite.config.ts
6. [ ] Position elements to fill 1920x1080 canvas with margins
7. [ ] Connect elements using cardinal points
8. [ ] Design animation sequence (progressive reveal)
9. [ ] Build with `make anim` to validate
10. [ ] Add to .qmd with appropriate shortcode options
