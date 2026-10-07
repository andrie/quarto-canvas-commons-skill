---
name: motion-canvas-r-code
description: Use when showing R or Python code in a Canvas Commons or Motion Canvas animation, when R or Python code in a Code node has no syntax colours, or when a canvas text node renders in the wrong font.
---

# R code in Canvas Commons animations

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

R code in a `Code` node needs a highlighter that knows R, and canvas text ignores fonts the page has not loaded. Two separate problems, two fixes.

| Symptom | Cause | Fix |
| --- | --- | --- |
| R code has no colours, or not your palette | Not established why the original scene had none. Verified: `lezer-r` does carry highlight tags, and the default `LezerHighlighter` colours R with its fixed default palette, tagged tokens only | `highlighter={new RHighlighter(parser, colours)}` colours by node name with your palette |
| Text renders in the wrong font, no error | `fontFamily` only works for fonts the page has loaded or the viewer's system has installed. The built font CSS is a separate file that the deck page does not load by itself | Add the font CSS to the qmd `include-in-header`, and name only loaded fonts |

## Setup

1. `npm --prefix ./animations install lezer-r @lezer/common` (in `animations/package.json`, not the root one).
2. Copy `components/RHighlighter.ts` to `animations/src/components/`.
3. Copy `assets/lezer-r.d.ts` to `animations/src/` (`lezer-r` ships no types).
4. Copy `assets/global.css` to `animations/` and add `import '../global.css';` to the scene's project file (`animations/src/<name>.ts`).
5. Load the built CSS in the deck. `make anim` emits it as `dist/animations/<name>.css` (check with `ls dist/animations/*.css`), and `resources: dist/**` already publishes it. Add to the qmd YAML. `<name>` in the CSS filename is the chunk name (`smoke.css` here, `global.css` when several projects share it), and the script path `./dist/motion-canvas-ts.js` is the template's:

```yaml
include-in-header:
  - text: <script src="./dist/motion-canvas-ts.js"></script>
  - text: <link rel="stylesheet" href="./dist/animations/<name>.css">
```

Steps 4 and 5 are only for web fonts, the ones `global.css` loads. A scene that names only system fonts needs neither the CSS import nor the stylesheet line. The generic families `monospace`, `sans-serif`, `serif` and `system-ui` are always safe. A named font installed on the computer, such as `'DejaVu Sans Mono'`, also works without CSS, but only on a machine where it is installed: anywhere else the next family in the list renders, so end the list with a generic family.

## Using it in a scene

In 0.4.0 `Code` has no `language` prop. Highlighting comes from its `highlighter` prop:

```tsx
import {Code} from '@canvas-commons/2d';
import {Colors, Posit} from '../styles';
import {parser} from 'lezer-r';
import {RHighlighter} from '../components/RHighlighter';

const rHighlighter = new RHighlighter(parser, {
  default: Colors.TEXT, identifier: Posit.orange, function: Colors.FUNCTION,
  keyword: Colors.KEYWORD, string: Colors.STRING, comment: Colors.COMMENT,
  operator: Posit.teal, number: Colors.NUMBER,
});

<Code highlighter={rHighlighter} code={rCode} fontSize={24} fontFamily="'Fira Code', monospace" />
```

All eight colour keys are read, so supply all of them. `assets/shiny-ellmer-code.R` is the sample R code. The worked example scene is `<skill>/../../seed/scenes/shiny-ellmer.tsx`, where `<skill>` is this skill's directory. The installed skill is a symlink into the repository, so resolve it first: `$(readlink -f ~/.claude/skills/motion-canvas-r-code)/../../seed/scenes/shiny-ellmer.tsx` (a lexical `..` from `~/.claude/skills/` would miss the repository).

## Other languages: Python

The same `highlighter` prop takes a `LezerHighlighter` built from a Lezer grammar and a `HighlightStyle`. Python needs one package:

```bash
npm --prefix ./animations install @lezer/python
```

`@codemirror/language` (for `HighlightStyle`) and `@lezer/highlight` (for `tags`) need no install: they come with `@canvas-commons/2d`.

```tsx
import {Code, LezerHighlighter} from '@canvas-commons/2d';
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {parser as pythonParser} from '@lezer/python';
import {Colors, Posit} from '../styles';

const pythonStyle = HighlightStyle.define([
  {tag: tags.keyword, color: Colors.KEYWORD},
  {tag: tags.string, color: Colors.STRING},
  {tag: tags.comment, color: Colors.COMMENT},
  {tag: [tags.number, tags.bool, tags.null], color: Colors.NUMBER},
  {tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: Colors.FUNCTION},
  {tag: tags.propertyName, color: Colors.PROPERTY},
  {tag: tags.variableName, color: Colors.TEXT},
  {tag: tags.operator, color: Posit.teal},
  {tag: tags.punctuation, color: Colors.TEXT},
]);
const pythonHighlighter = new LezerHighlighter(pythonParser, pythonStyle);

<Code highlighter={pythonHighlighter} code={pythonCode} fill={Colors.TEXT} fontSize={32} fontFamily="monospace" />
```

`@lezer/python` 1.1 tags tokens with specific tags (`controlKeyword`, `definitionKeyword`, `moduleKeyword`, `lineComment`, `arithmeticOperator`, `paren` and so on). A rule for the parent tag covers its children, so `tags.keyword`, `tags.comment`, `tags.operator` and `tags.punctuation` colour all of them. `True`, `False` and `None` are `bool` and `null`, not keywords, and need their own rule. Function names in calls and `def` lines are `function(variableName)`, and method calls are `function(propertyName)`. `fill` colours any token no rule matches. Unlike `RHighlighter`, the rules are optional: leave one out and that token takes the `fill`.

## Known gap: pipes

The `lezer-r` 0.1.3 grammar cannot see the pipes `|>` and `%>%`. It parses `|>` as a `LogicOp` (`|`) followed by an error node, and `%>%` as a single error node, so no `switch` case in `RHighlighter` can colour them. The fix lies outside the tree: scan the code for `|>` and `%[^%\s]*%` in `prepare()` and add those ranges to `colorLookup`, or use a newer or patched grammar. Not implemented here.

## Reference

Read `references/fonts-and-highlighting.md` for why each problem happens, how to load a font, and how `RHighlighter` works.
