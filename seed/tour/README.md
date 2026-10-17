# Tour scenes

Ten small scenes that each show one thing you can ask for, taken from the deck in the `canvas-commons-smoketest` project. They are the clearest examples of the basics in this repo: each one is about 3 to 6 KB, and each answers a plain request such as "make the same move with six different easing curves". Read them in the order below.

| Scene | What it shows |
|-------|---------------|
| `the-loop` | The cycle of describing a scene, having Claude write it, and looking at the result |
| `shapes-and-text` | Shapes, text, code and maths on screen |
| `properties` | Position, size, opacity and colour changing |
| `easing` | The same move with six different curves |
| `timing` | Animations one after another, together and staggered |
| `layout-reflow` | Layout moving to make room when content changes |
| `svg-logos` | Logos and other SVG, including recolouring a path by path |
| `connect-boxes` | Boxes joined by arrows that follow them |
| `code-basic` | Code that types itself in, in R and Python |
| `code-with-effect` | Code on the left and its effect on the right |

The two longer scenes from the same deck, Python and R in one environment and the Package Manager repositories, are not here.

## Using them

The scenes import `../styles`, which a project made from the current template has (it includes the `UI`, `MONO`, `MUTED`, `PANEL`, `CLEAR` and `BORDER` constants they use). A project from an older template lacks those six: append the last block of the library's `styles.ts` to its `animations/src/styles.ts`. From the project root:

1. Create the scene, then copy the tour file over the skeleton it writes. Repeat for each scene you want.

   ```bash
   node <skill>/scripts/add-scene.js easing
   cp <repo>/seed/tour/scenes/easing.tsx animations/src/scenes/easing.tsx
   ```

2. Copy what the scenes share. `stage.tsx` has the title, the prompt bar and `swapText`. Only `svg-logos` needs `assets/` and `raw.d.ts`, and only the three code scenes and `shapes-and-text` need `highlighters.ts`.

   ```bash
   cp -r <repo>/seed/tour/components animations/src/
   cp -r <repo>/seed/tour/assets animations/src/
   cp <repo>/seed/tour/raw.d.ts animations/src/
   ```

3. For the code scenes, add the R highlighter as in step 2 to 3 of the `motion-canvas-r-code` skill (`components/RHighlighter.ts` into `animations/src/components/`, `assets/lezer-r.d.ts` into `animations/src/`), then install the Python grammar.

   ```bash
   npm --prefix ./animations install @lezer/python @lezer/common
   ```

4. `make anim`. The scenes build with `tsc` strictness in a project from the template.

The scenes use Posit's colours and the Segoe UI and Cascadia Code font stacks, so on a machine without those fonts the text falls back to the system fonts.
