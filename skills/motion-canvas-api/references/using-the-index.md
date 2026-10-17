# Using the generated reference data (version 0.4.0, commit 2da1d4a)

How to read and query `component-hierarchy.md` and `api-search-index.json`, which are generated from the Canvas Commons source.

Two files under `references/` are generated offline from the Canvas Commons source, so they list the real exported API rather than what this page remembers.

- `references/component-hierarchy.md`: the class tree, `Node > Layout > Shape > Curve > Rect` and so on, with each class's JSDoc summary. Read it to see which props a node inherits.
- `references/api-search-index.json`: 800+ exported classes, functions, types and enums from `core` and `2d`, each with `kind`, `package`, `signature`, `description`, class `members`, `examples` and example scenes, plus the synonym and purpose data. Query it with `node scripts/search-api.js Rect` (also takes `--limit 3`). It reads the committed index, so it needs only Node, no TypeScript. It matches exact names, aliases ("rectangle" or "box" finds Rect), prefixes, substrings, synonyms, purposes, member names and descriptions, and corrects typos ("retangle" finds Rect) by edit distance when few results match. It does no true subsequence matching: a short query such as `rct` only works when it is within one edit of a name.

Short keywords work best. A multi-word query is split into content words (in, a, the, of, one, another, along and similar are dropped) and each entry is ranked by how many words match, so partial matches still appear. Intent phrases lead to the real APIs, for example `node scripts/search-api.js "fade in one after another"` finds `chain` and `sequence`, and `node scripts/search-api.js "move along path"` finds `Curve` and its `getPointAtPercentage` member, with the signature printed. Matched member signatures are shown under the entry.

The timing and easing functions (`all`, `chain`, `sequence`, `delay`, `loop`, `waitFor`, `tween`, `linear`, `easeInOutCubic` and the rest) are all exported by `@canvas-commons/core`, not `@canvas-commons/2d`.

`references/api-reference.md` is a hand-written cheat sheet (common patterns, project layout, gotchas, worked Code, Polygon and 3D examples) that can lag the source. The two generated files above list what the source actually exports, so check them when the two disagree.

Members listed for a class are the ones it declares itself, not inherited ones: follow `extends` up the hierarchy for the rest. Several classes (Rect and Path among them) have no JSDoc in 0.4.0, so their description is empty.

Regenerating the two generated files is a maintainer task: see `references/regenerating.md`. Do not run it while writing scenes.
