---
name: motion-canvas-r-code
description: Use when showing R code in a Canvas Commons or Motion Canvas animation, when R code in a Code node has no syntax colours, or when a canvas text node renders in the wrong font.
---

# R code in Canvas Commons animations

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

The `Code` node has no R support out of the box, and canvas text ignores fonts the page has not loaded. Two separate problems, two fixes.

| Symptom | Cause | Fix |
| --- | --- | --- |
| R code renders in one flat colour | `lezer-r` parses R but attaches no highlight tags, so the normal tag-based highlighting finds nothing | Pass `highlighter={new RHighlighter(parser, colours)}`, which colours by node name |
| Text renders in the wrong font, with no error | `fontFamily` only works for fonts already loaded in the document, and the first-named font was never loaded | Load fonts in `global.css`, import it in the project file, and name only loaded fonts |

## Setup

1. `npm --prefix ./animations install lezer-r @lezer/common` (in `animations/package.json`, not the root one).
2. Copy `components/RHighlighter.ts` to `animations/src/components/`.
3. Copy `assets/lezer-r.d.ts` to `animations/src/` (`lezer-r` ships no types).
4. Copy `assets/global.css` to `animations/` and add `import '../global.css';` to the scene's project file (`animations/src/<name>.ts`).

## Using it in a scene

In 0.4.0 `Code` has no `language` prop. Highlighting comes from its `highlighter` prop:

```tsx
import {Code} from '@canvas-commons/2d';
import {parser} from 'lezer-r';
import {RHighlighter} from '../components/RHighlighter';

const rHighlighter = new RHighlighter(parser, {
  default: Colors.TEXT, identifier: Posit.orange, function: Colors.FUNCTION,
  keyword: Colors.KEYWORD, string: Colors.STRING, comment: Colors.COMMENT,
  operator: Posit.teal, number: Colors.NUMBER,
});

<Code highlighter={rHighlighter} code={rCode} fontSize={24} fontFamily="'Fira Code', monospace" />
```

All eight colour keys are read, so supply all of them. `assets/shiny-ellmer-code.R` is sample R code for the worked example, the `shiny-ellmer` scene in `seed/scenes/`.

## Known gap: pipes

`RHighlighter` has no case for the pipe operators `|>` and `%>%`, so they render in the default colour. Add a case for the pipe node name to the `switch` in `walkTree`. Print the node names for a pipe line first, since the grammar's name for it is not documented here.

## Reference

Read `references/fonts-and-highlighting.md` for why each problem happens, how to load a font, and how `RHighlighter` works.
