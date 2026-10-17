# Fonts and highlighting for R code

## Canvas text and font loading

`Code` and `Txt` draw onto an HTML5 `<canvas>`, not DOM text. Naming a font in `fontFamily` does nothing unless that font has already been loaded into the document through normal CSS font loading, or is installed on the viewer's system (checked in headless Chromium: an installed `'DejaVu Serif'` changed the measured width with no CSS, while an uninstalled name measured the same as the fallback). If it has not, the browser silently falls back to the next family in the list, or to a generic one. There is no error, only the wrong font.

### The JetBrains Mono finding

The original `shiny-ellmer` scene sets `fontFamily="'JetBrains Mono', 'Fira Code', monospace"`. No JetBrains Mono file or import exists anywhere in the project. Only Fira Code (a Google Fonts `@import`) and Open Sans (a local file) are loaded, so the scene has always rendered in Fira Code, or in the generic monospace fallback if Fira Code had not arrived yet. Listing an unloaded font first is harmless but misleading.

Recommendation: name only fonts you load, for example `fontFamily="'Fira Code', monospace"`. If you want JetBrains Mono, load it first.

### Loading a font

Put the loading CSS in `animations/global.css` (the copy in `assets/global.css` loads Fira Code and Open Sans) and import it from the Canvas Commons project file, not from the scene:

```ts
// animations/src/<name>.ts
import <name> from './scenes/<name>?scene';
import '../global.css';
```

Importing it there is not enough for a deployed deck. Verified in a copy of the bootstrap template (a Quarto deck with `resources: dist/**`): `vite build` emits the CSS as a separate file, `dist/animations/<name>.css` (here `smoke.css`; it can be `global.css` when several projects share it, so run `ls dist/animations/*.css`), and the scene bundle does not inject it. Rendered in headless Chromium, with no further change, `document.fonts` listed no Fira Code or Open Sans face at all, and a canvas `measureText` for `80px 'Fira Code', serif` matched the plain serif fallback (323.4 px for the same string). The deck page must load the CSS. Add one line to the qmd:

```yaml
format:
  revealjs:
    resources:
      - dist/**
    include-in-header:
      - text: <link rel="stylesheet" href="./dist/animations/<name>.css">
```

With the line, Fira Code showed as `loaded` and the measured width changed (288 px), so the font was used. The `dist/**` glob publishes everything under `dist/`, including the CSS file and any `_fonts` directory, so nothing else is needed.

Two details of `global.css`:

- Fira Code comes from a Google Fonts `@import`, a network fetch, so it fails offline and the fallback renders. The template ships no local Fira Code file. For offline use, put a font file in `animations/public/_fonts/` and declare it with `@font-face`.
- A font URL must be relative to the built CSS, which sits in `dist/animations/`, and `animations/public/` is copied to the root of that folder. The original `url(public/_fonts/...)` resolved to `dist/animations/public/_fonts/...`, which returned 404, and `Open Sans` showed as `error`. With `url(_fonts/Open_Sans/...)` (as in `assets/global.css`) it loaded and the width changed (282 px). Vite warns that the URL "didn't resolve at build time"; that is expected, it is resolved at runtime.

Check what loaded with `[...document.fonts].map(f => f.family + ':' + f.status)` in the browser console. Do not rely on `document.fonts.check()`: it returns `true` for a family it has never heard of.

Canvas Commons 0.4.0 also exports `requestFontLoad` and `fontsVersion`, and `Txt` calls `requestFontLoad` itself for each font it draws, so you do not need to. It starts a load but cannot declare a face: the `@font-face` or `@import` rule must still be on the page. I read this in the source and did not test calling it directly.

Do not duplicate `@font-face` rules for the same font across `global.css`, the Quarto theme and old stylesheets. The original project had three copies of the Open Sans rule from trial and error.

## Highlighting and RHighlighter

### What is verified about lezer-r

Earlier notes said `lezer-r` attaches no highlighting tags. That is wrong for 0.1.3. Its `src/highlight.js` is a `styleTags` call that maps `Comment`, `String`, `FunctionCall/Identifier`, `Numeric`, `ArithOp`, `AssignmentOperator`, `Logical` and others to `@lezer/highlight` tags. Running `highlightTree` over `ui <- fluidPage(textInput("a", 1), # hi` gave tags for `<-`, both function names, the string, the number and the comment. Canvas Commons' own `LezerHighlighter(parser)` with the default style also coloured those seven tokens (functions teal `#8fbcbb`, strings and `<-` green, number purple, comment grey, `TRUE` orange). Plain identifiers, `$` and parentheses get no colour from the default style.

So the default highlighter does work on R in 0.4.0 with a single copy of `@lezer/highlight`. **Not established**: why the original `shiny-ellmer` scene showed no colours. Untested candidates are an older Motion Canvas, or two copies of `@lezer/highlight` so the tags do not match the style.

### Why RHighlighter still earns its place

It gives you control. It implements `CodeHighlighter` directly, ignores tags, and chooses colours by node name from the palette you pass in, including separate colours for variables and functions.

- `prepare(code)` parses the code, walks the tree, and switches on `node.name` to build a `Map` from `"from-to"` ranges to colours. Only leaf nodes (no children) are coloured.
- `highlight(index, cache)` scans that map for the character index and returns the colour plus a `skipAhead`.
- `tokenize(code)` splits on whitespace.

A function name and a variable are both `Identifier`. `node.parent.name === 'FunctionCall'` tells them apart, so `library` gets the `function` colour and `shiny` gets the `identifier` colour.

`CodeHighlighter` and `HighlightResult` are exported from the `@canvas-commons/2d` package root in 0.4.0, so `RHighlighter.ts` imports them from there.

### Covered and uncovered node names

Covered by the `switch`: `Identifier`, `function` (keyword), `String`, `Comment`, `AssignmentOperator`, `ExtractionOp`, `ArithOp`, `CompareOp`, `Numeric`, `Integer`. Anything else gets the `default` colour.

Present in the grammar but not handled: `MatrixOp` (`%/%`, `%*%`, `%o%`, `%x%`), `LogicOp` (`|`, `||`, `&`, `&&`), `NamespaceOp` (`::`, `:::`), `BitOp`, `Logical` (`TRUE`, `FALSE`), `Complex`, `Inf`, `NamedArg`, `SpecialConstant`, and the control keywords (`if`, `else`, `for`, `while`, `repeat`, `return`, `break`, `next`, `in`). Only `function` is treated as a keyword. The sample R code uses none of these.

### The pipe gap

The grammar has no pipe node. Parsing `x |> f()` gives `LogicOp[2-3]` for the `|` and an error node for `>`; parsing `x %>% f()` gives a single error node for `%>%`. By contrast `%in%` is a `CompareOp`, `%%` an `ArithOp` and `%/%` a `MatrixOp`. A `switch` case cannot colour what the tree does not name, so handle pipes outside the tree: a regex scan in `prepare()` for `|>` and `%[^%\s]*%` that adds ranges to `colorLookup`, or a newer or patched grammar. Not implemented in `RHighlighter.ts`.

### Dependency placement

`lezer-r` is imported by scene code, so it belongs in `animations/package.json`. In the original project it sat in the root `package.json`, which resolved by walking up the directory tree and was fragile. A fresh `npm install && npm --prefix ./animations install` followed by `make anim` builds with `lezer-r` declared only in `animations/package.json`.
