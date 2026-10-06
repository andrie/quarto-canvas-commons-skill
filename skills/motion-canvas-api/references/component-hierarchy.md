# Canvas Commons component hierarchy

Generated from canvas-commons/canvas-commons, version 0.4.0, commit 2da1d4a, by `skills/motion-canvas-api/scripts/generate-component-hierarchy.js`. Do not edit by hand.

Each line is a class from `packages/2d/src/**/components`, with the first sentence of its JSDoc. Children extend their parent. A class with no description has no JSDoc in the 0.4.0 source.

```
Node
├── Camera: A node representing an orthographic camera.
├── Knot: A node representing a knot of a Spline.
├── Layout
│   └── Shape
│       ├── Code: A node for displaying and animating code.
│       ├── Curve
│       │   ├── Bezier
│       │   │   ├── CubicBezier: A node for drawing a cubic Bézier curve.
│       │   │   └── QuadBezier: A node for drawing a quadratic Bézier curve.
│       │   ├── Circle: A node for drawing circular shapes.
│       │   ├── Line: A node for drawing lines and polygons.
│       │   ├── Path
│       │   ├── Polygon: A node for drawing regular polygons.
│       │   ├── Ray: A node for drawing an individual line segment.
│       │   ├── Rect
│       │   │   ├── Img: A node for displaying images.
│       │   │   ├── Video
│       │   │   └── View2D
│       │   └── Spline: A node for drawing a smooth line through a number of points.
│       ├── Grid: A node for drawing a two-dimensional grid.
│       ├── SVG: A Node for drawing and animating SVG images.
│       │   ├── Icon: An Icon Component that provides easy access to over 150k icons.
│       │   └── Latex: A node for animating equations with LaTeX.
│       └── Txt: A paragraph of text.
└── TxtLeaf: A leaf text node that holds text content.
```
