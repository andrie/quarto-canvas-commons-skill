# Fonts and highlighting for R code

## Canvas text and font loading

`Code` and `Txt` draw onto an HTML5 `<canvas>`, not DOM text. Naming a font in `fontFamily` does nothing unless that font has already been loaded into the document through normal CSS font loading. If it has not, the browser silently falls back to the next family in the list, or to a generic one. There is no error, only the wrong font.

### The JetBrains Mono finding

The original `shiny-ellmer` scene sets `fontFamily="'JetBrains Mono', 'Fira Code', monospace"`. No JetBrains Mono file or import exists anywhere in the project. Only Fira Code (a Google Fonts `@import`) and Open Sans (a local file) are loaded, so the scene has always rendered in Fira Code, or in the generic monospace fallback if Fira Code had not arrived yet. Listing an unloaded font first is harmless but misleading.

Recommendation: name only fonts you load, for example `fontFamily="'Fira Code', monospace"`. If you want JetBrains Mono, load it first.

### Loading a font

Put the loading CSS in `animations/global.css` (the copy in `assets/global.css` loads Fira Code and Open Sans):

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap');

@font-face {
  font-family: 'Open Sans';
  src: local('Open Sans'), url(public/_fonts/Open_Sans/OpenSans-VariableFont_wdth\,wght.ttf) format('truetype');
}
```

Import it from the Canvas Commons project file, not from the scene and not through a Quarto `<link>`:

```ts
// animations/src/shiny-ellmer.ts
import shiny_ellmer from './scenes/shiny-ellmer?scene';
import '../global.css';
```

Observed in a built project: `vite build` emits the CSS as a separate file, `dist/animations/global.css`, and the scene bundle does not inject it. A bare page that loads only the player rendered the code in the browser's monospace fallback until the page also had `<link rel="stylesheet" href="./animations/global.css">`, after which Fira Code rendered. If a deployed deck shows the wrong font, check that `global.css` (or the font CSS from your Quarto theme) reaches the page.

Check what loaded with `[...document.fonts].map(f => f.family + ':' + f.status)` in the browser console. Do not rely on `document.fonts.check()`: it returns `true` for a family it has never heard of.

Do not duplicate `@font-face` rules for the same font across `global.css`, the Quarto theme and old stylesheets. The original project had three copies of the Open Sans rule from trial and error.

## Highlighting: why RHighlighter exists

`lezer-r` produces a correct concrete syntax tree, with node names such as `Identifier`, `FunctionCall`, `AssignmentOperator`, `ExtractionOp`, `String`, `Comment`, `Numeric`. Unlike `@lezer/javascript`, it attaches none of Lezer's standard highlighting tags to them, so a `HighlightStyle`-based pipeline gets no colour information.

`RHighlighter` implements the `CodeHighlighter` interface directly and ignores tags:

- `prepare(code)` parses the code, walks the tree, and switches on `node.name` to build a `Map` from `"from-to"` ranges to colours. Only leaf nodes (no children) are coloured.
- `highlight(index, cache)` scans that map for the character index and returns the colour plus a `skipAhead`.
- `tokenize(code)` splits on whitespace.

One real piece of logic: a function name and a variable are both `Identifier`. `node.parent.name === 'FunctionCall'` tells them apart, so `library` gets the `function` colour and `shiny` gets the `identifier` colour.

`CodeHighlighter` and `HighlightResult` are exported from the `@canvas-commons/2d` package root in 0.4.0, so `RHighlighter.ts` imports them from there.

### Covered and uncovered node names

Covered: `Identifier`, `function` (keyword), `String`, `Comment`, `AssignmentOperator`, `ExtractionOp`, `ArithOp`, `CompareOp`, `Numeric`, `Integer`. The sample R code uses `<-`, `$`, function calls, strings and comments, and no pipes. Anything not in the `switch` gets the `default` colour.

### Dependency placement

`lezer-r` is imported by scene code, so it belongs in `animations/package.json`. In the original project it sat in the root `package.json`, which resolved by walking up the directory tree and was fragile. A fresh `npm install && npm --prefix ./animations install` followed by `make anim` builds with `lezer-r` declared only in `animations/package.json`.
