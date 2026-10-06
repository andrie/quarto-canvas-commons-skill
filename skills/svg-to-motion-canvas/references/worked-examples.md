# Worked examples

Three draw.io diagrams and the scenes translated from them live in `seed/`, plus four stand-alone scenes. Read the pair closest to your diagram before starting. The scenes assume the project layout in `skills/canvas-commons-library/README.md` (the library symlinked at `animations/src/lib`).

## Diagram and scene pairs

### infosec_triad: a polygon with vertex-anchored labels

`seed/diagrams/infosec_triad.drawio.svg` is a rotated triangle path with three text labels. `seed/scenes/infosec-triad.tsx` replaces the path with `<Polygon sides={3}>` and places each label from `triangleRef().vertex(n)` plus a spacing offset, so the labels follow the shape instead of hardcoded coordinates. It compensates for the way a polygon is inscribed in its size with scale factors. The animation is minimal: the triangle is visible at once and the labels fade in one after another with `opacity(1, 2)`.

### multiple_sources: cloning an element outwards

`seed/diagrams/multiple_sources.drawio.svg` is the User, App and LLM layout with three databases. `seed/scenes/multi-database.tsx` builds the boxes as `Layout` wrapping `Rect` and `Txt`, joins them with `Line` nodes between cardinal points, and draws the cylinders with the shared `Database` component (`skills/canvas-commons-library/components/Database.tsx`). The databases all start at the centre and slide left and right with an opacity fade, which shows how to animate toward the final layout in the SVG rather than building it statically.

### llm_app: a diagram plus a live code panel

`seed/diagrams/llm_app.drawio.svg` is User, App and LLM with one database below the App. `seed/scenes/shiny-ellmer.tsx` keeps the same base layout and adds a `Code` panel on the left (`anchorX={-1}`, which was `offsetX` before 0.4.0) that reveals R code line by line through the custom `RHighlighter`. It is the worked example for combining a translated diagram with highlighted code, so read it with `skills/motion-canvas-r-code/SKILL.md`. The header comment of the scene lists the project files it expects.

## Stand-alone scenes

- `seed/scenes/posit_logo-pmds.tsx`: the Posit logo built from `Path` nodes, with chevrons that morph and move in sequence.
- `seed/scenes/posit_logo-paddling-boat.tsx`: the same logo as a path morph into a boat, paced by `waitUntil('text')`, `waitUntil('boat')` and `waitUntil('end')` so the timing can be set in the editor.
- `seed/scenes/kayak.tsx`: a hand-built vector character, drawn from keypoint arrays as `Line` and `Circle` nodes and moved between poses by tweening one signal.
- `seed/scenes/one23.tsx`: the smallest example, a few shapes and lines in 22 lines, the best place to start reading.
