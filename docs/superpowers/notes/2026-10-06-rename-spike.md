# Rename spike: @motion-canvas to @canvas-commons 0.4.0

Verdict: the port is **not rename-only**. The scope rename is necessary but not sufficient. Six further changes are needed (listed under Failures), all small and mechanical. With them applied, `make anim && quarto render infosec.qmd` succeeds on the whole infosec project, and every animation tested plays in a headless browser.

Smoke project: `~/github/canvas-commons-smoke` (copy of `conf-2025-working-with-infosec`, committed there as `82f0777`). Versions tested: all `@canvas-commons/*` at 0.4.0, node 22, vite 4.5.14 (animations) and vite 7 (root), TypeScript 5.x, quarto with revealjs.

## Imports

Scope rename (`sed 's#@motion-canvas/#@canvas-commons/#g'`) must be applied to `*.ts`, `*.tsx`, `*.json` **and `*.meta`** (the `.meta` files hold the exporter id, see Failures 5). Package names map one to one: `core`, `2d`, `player`, `ffmpeg`, `vite-plugin`. Only `ui` changes: it is now `editor`.

All `lib/...` deep imports are gone. The 0.4.0 packages have an `exports` map exposing only `.` (plus `2d/jsx-runtime`, `2d/jsx-dev-runtime`, `2d/editor`, `core/project`, `core/shaders/*`, `*/tsconfig.project.json`, `*/package.json`). Every symbol is re-exported from the package root. Rule: import everything from `@canvas-commons/core` or `@canvas-commons/2d`.

| Before | After |
| --- | --- |
| `import {makeScene2D} from '@motion-canvas/2d';` | `import {makeScene2D} from '@canvas-commons/2d';` |
| `import {makeScene2D} from '@motion-canvas/2d/lib/scenes';` | `import {makeScene2D} from '@canvas-commons/2d';` |
| `import {Node, Circle, Polygon, Txt, Layout} from '@motion-canvas/2d/lib/components';` | `import {Node, Circle, Polygon, Txt, Layout} from '@canvas-commons/2d';` |
| `import {initial, signal} from '@motion-canvas/2d/lib/decorators';` | `import {initial, signal} from '@canvas-commons/2d';` |
| `import {CodeHighlighter, HighlightResult} from '@motion-canvas/2d/lib/code/CodeHighlighter';` | `import {CodeHighlighter, HighlightResult} from '@canvas-commons/2d';` |
| `import {delay, waitFor, waitUntil} from '@motion-canvas/core/lib/flow';` | `import {delay, waitFor, waitUntil} from '@canvas-commons/core';` |
| `import {createRef, makeRef, range, useRandom} from '@motion-canvas/core/lib/utils';` | `import {createRef, makeRef, range, useRandom} from '@canvas-commons/core';` |
| `import {createSignal} from '@motion-canvas/core/lib/signals';` | `import {createSignal} from '@canvas-commons/core';` |
| `import {linear} from '@motion-canvas/core/lib/tweening';` | `import {linear} from '@canvas-commons/core';` |
| `import {PossibleVector2, Vector2} from '@motion-canvas/core/lib/types';` | `import {PossibleVector2, Vector2} from '@canvas-commons/core';` |
| `/// <reference types="@motion-canvas/core/project" />` | `/// <reference types="@canvas-commons/core/project" />` (unchanged apart from scope) |
| `import '@motion-canvas/player';` (root `src/main.ts`) | `import '@canvas-commons/player';` |

Mechanical fix for deep imports, applied after the scope sed:

```bash
sed -i -E "s#'@canvas-commons/(2d|core)/lib/[a-zA-Z/]+'#'@canvas-commons/\1'#" src/**/*.ts src/**/*.tsx
```

Things that did **not** change: `makeProject`, `makeScene2D`, the `?scene` import suffix, `CodeHighlighter` / `HighlightResult` (still exported, same shape: the custom `RHighlighter implements CodeHighlighter<RCache | null>` compiled unchanged), `@canvas-commons/core/project` types, `useScene2D`, signals, decorators, `Code`, `Polygon`, `Path`, tweening and flow helpers. Multiple imports of the same package on separate lines (as in `hexagons.tsx`) are legal and compile.

One property rename in scene code: see Failures 2 (`offsetX` becomes `anchorX`).

## Dependencies

Root `package.json` (the player bundle, built by `npm run build` which is `vite build`):

```json
"dependencies": {
  "@canvas-commons/core": "^0.4.0",
  "@canvas-commons/player": "^0.4.0",
  "vite": "^7.1.5",
  "vite-plugin-static-copy": "^3.1.2"
},
"devDependencies": {
  "rollup-plugin-copy": "^3.5.0",
  "vite-plugin-copy": "^0.1.6"
}
```

`lezer-r` is **removed** from the root file.

`animations/package.json` (the set that builds):

```json
"type": "module",
"scripts": { "start": "vite", "serve": "vite", "build": "tsc && vite build" },
"dependencies": {
  "@lezer/javascript": "^1.5.4",
  "@canvas-commons/2d": "^0.4.0",
  "@canvas-commons/core": "^0.4.0",
  "@canvas-commons/ffmpeg": "^0.4.0",
  "@uiw/codemirror-themes": "^4.25.2",
  "lezer-r": "^0.1.3"
},
"devDependencies": {
  "@canvas-commons/vite-plugin": "^0.4.0",
  "@canvas-commons/editor": "^0.4.0",
  "@types/glob": "^7.2.0",
  "minimatch": "^3.1.2",
  "typescript": "^5.2.2",
  "vite": "^4.5.0",
  "vite-plugin-copy": "^0.1.6"
}
```

Notes:

- `@canvas-commons/ui` does not exist. `@canvas-commons/editor` replaces it, and it is **required**: removing it makes `vite build` fail with `Cannot find module '@canvas-commons/editor'`. The vite plugin imports it but does not declare it as a dependency or peer, so it must be listed explicitly.
- `@canvas-commons/ffmpeg` at `^0.4.0` installs fine. Nothing in the project imports it and the `.meta` exporter is `image-sequence`, so it was not exercised by the build.
- `vite-plugin` 0.4.0 declares peer `vite ^4 || ^5 || ^7 || ^8`, so vite 4.5 in `animations/` is still fine.
- `@types/chroma-js` is not needed provided `skipLibCheck` is set (see Vite config and Failures 3). Installing it alone fixes the chroma error but not the `project.d.ts` error.
- Lockfiles were deleted and regenerated (the old ones pinned `@motion-canvas/*`).
- `npm install` in `animations/` reports 14 vulnerabilities, all transitive dev tooling. Not addressed.

## Vite config

`animations/vite.config.ts`: the plugin default export is **unchanged**. Only the specifier changes.

```ts
// before
import motionCanvas from "@motion-canvas/vite-plugin";
// after
import motionCanvas from "@canvas-commons/vite-plugin";
// usage identical
motionCanvas({ project: ["./src/hexagons.ts", /* ... */] })
```

The `project: [...]` array option, `build.rollupOptions.output` (`dir: "../dist/animations"`, `entryFileNames: "[name].js"`) and the output layout are unchanged. Scenes are inlined into the project chunks, so output is `dist/animations/src/<project>.js` plus shared `styles.js`, `Database.js`, and `_virtual_settings.js` (about 2.6 MB, holds core and 2d). The Quarto `src="./animations/src/<name>.js"` paths are therefore unchanged.

Differences that matter:

1. `animations/package.json` needs `"type": "module"`. The 0.4.0 plugin is ESM-only (`"type": "module"`, no CJS build). Without it, vite 4 bundles `vite.config.ts` as CJS and fails (Failures 1). Renaming the config to `vite.config.mts` should also work but was not tried. Keep `.ts` plus `type: module` so the Makefile dependency on `animations/vite.config.ts` stays valid.
2. `animations/tsconfig.json` needs `skipLibCheck`:

```json
{
  "extends": "@canvas-commons/2d/tsconfig.project.json",
  "compilerOptions": { "skipLibCheck": true },
  "include": ["src"]
}
```

`@canvas-commons/2d/tsconfig.project.json` exists and `extends` it is the only scope change otherwise.

Root `vite.config.ts` needed no change (it has no motion-canvas import). Root `src/main.ts` side-effect imports `@canvas-commons/core` and `@canvas-commons/player`, which registers the new element tag (see Quarto).

The `.meta` files: rename `"exporter": {"name": "@motion-canvas/core/image-sequence"}` to `"@canvas-commons/core/image-sequence"`. The plugin accepted both without erroring, but the built `_virtual_settings.js` registers only the new id, so an old id would not resolve to an exporter in the editor.

## Quarto

`quarto render infosec.qmd` (via `make quarto`) succeeds with no `.qmd` changes. The **extension needs one rename**: the 0.4.0 player registers the custom element `canvas-commons-player`, not `motion-canvas-player` (see `node_modules/@canvas-commons/player/dist/main.js`: `customElements.define("canvas-commons-player", ...)`). Changes in `_extensions/andrie/motion-canvas/`:

- `motion-canvas.lua`: emit `<canvas-commons-player src="..." ...></canvas-commons-player>`, and the injected CSS selector becomes `canvas-commons-player { width: 75%; }`.
- `motion-canvas-player.js`: both `querySelector('motion-canvas-player')` calls become `querySelector('canvas-commons-player')`.
- The shortcode name (`{{< motion-canvas ... >}}`), the Lua and JS filenames and the `_extension.yml` are unchanged. The player attributes the extension uses (`src`, `auto`, `quality`, `width`, `height`) are all still observed; `loop`, `fullscreen` and `background` are handled by the extension itself.
- The private `Player` members the JS reaches into at runtime (`player.player.frame.value`, `.endFrame`, `.active`, `.activate()`, `.deactivate()`, `.requestSeek()`) all still exist in 0.4.0.

Verification (headless Chromium via playwright, page served over HTTP): `canvas-commons-player` is defined, 7 players on 13 slides, each reachable slide reached `state-ready playing auto` with the frame counter advancing (posit_footer end frame 266, shiny-ellmer 349, hexagons 256). A screenshot of the hexagons slide shows the animation rendering. One console `pageerror` comes from the reveal `appearance` plugin (`appearance.js`, `querySelectorAll` of null) and is unrelated to canvas-commons. A browser could not be launched initially because `libasound.so.2` was missing; fixed without sudo by extracting the `libasound2t64` deb to a temp directory and setting `LD_LIBRARY_PATH`.

## Failures

Each entry: symptom, cause, fix.

1. **`Error: "@canvas-commons/vite-plugin" resolved to an ESM file. ESM file cannot be loaded by require`** during `vite build` in `animations/`. Cause: plugin is ESM-only, `animations/package.json` had no `type`. Fix: add `"type": "module"` to `animations/package.json`.
2. **`TS2322 ... Property 'offsetX' does not exist on type 'CodeProps'`** (`shiny-ellmer.tsx`, `<Code offsetX={-1} />`). Cause: Node's `offset` was renamed `anchor` in 0.4.0 (docs in the d.ts: "the offset of this node's origin", `anchor`, `anchorX`, `anchorY`; a separate `translate` is a visual offset). Fix: `offsetX={-1}` becomes `anchorX={-1}`. Any `offset`, `offsetX`, `offsetY` prop, signal call or tween on a Node must be renamed to `anchor*`. This is the one scene-code API change found. Only one occurrence in this project, but Task 3 and 7 must grep for `offset`.
3. **`TS7016 Could not find a declaration file for module 'chroma-js'`** and **`TS1203 Export assignment cannot be used when targeting ECMAScript modules`** (in `core/project.d.ts`, five times). Cause: core's `.d.ts` imports `chroma-js` types that live in core's devDependencies, and `project.d.ts` uses `export =`. Fix: `"skipLibCheck": true` in `animations/tsconfig.json`. Adding `@types/chroma-js` alone fixes only the first.
4. **`TS2307 Cannot find module '@canvas-commons/2d/lib/components'` (and `lib/decorators`, `lib/code/CodeHighlighter`, `core/lib/flow|utils|signals|tweening|types`, `2d/lib/scenes`)**, which then cascades into dozens of misleading errors (`Property 'width' does not exist on type 'Database'`, `'Database' cannot be used as a JSX component`). Cause: `exports` map has no `lib/*` subpaths. Fix: import from the package root (Imports section). Fix the first TS2307 errors and the cascade disappears.
5. **`.meta` files still name the old exporter id** (`@motion-canvas/core/image-sequence`). Not an error at build, but the sed in the brief (`--include='*.ts' '*.tsx' '*.json'`) misses `.meta`. Fix: include `--include='*.meta'`.
6. **`Cannot find module '@canvas-commons/editor'`** when `editor` is omitted from devDependencies. Fix: keep `@canvas-commons/editor` in `animations/package.json` (Dependencies).
7. **Player element not found by the extension.** No build error: the extension still emitted `motion-canvas-player`, which nothing defines, so slides would silently show no animation. Found by reading the player bundle. Fix: Quarto section.

Environmental, not a canvas-commons issue: `make clean` calls `powershell`, so it does not work on Linux. `make install` calls `mnpm`. Neither was used.

## Motion Canvas 3.13 vs 3.17 (PMDS and goes-paddling scenes)

Scenes copied from `seed/` (`seed/lib/scenes/hexagons.tsx` from PMDS at 3.13, `seed/scenes/kayak.tsx` from goes-paddling at 3.13) were registered as `pmds-hexagons.ts` and `kayak.ts` (plus `.meta` copies and entries in the plugin's `project` array). After the scope sed plus the deep-import rewrite, both compiled and built with no further changes, and both play (kayak 181 frames, pmds-hexagons 256 frames, checked in a browser).

No 3.13 versus 3.17 API difference showed up beyond what 3.17 already shared: the PMDS and goes-paddling scenes use the same `lib/...` deep imports as the 3.17 infosec scenes, and the same rewrite fixes both. The differences between PMDS and infosec `hexagons.tsx` are content (for example `Posit.orange` versus `Posit.blue` as the highlight colour), not API. `kayak.tsx` has a harmless doubled `;;` on line 1 and a commented-out import, which the build tolerates (Task 7 already plans to clean the dead code).

Outputs: `dist/animations/src/pmds-hexagons.js` (1.38 kB) and `dist/animations/src/kayak.js` (2.73 kB), alongside the six original projects. Note the brief expected `dist/animations/<scene>.js`; the real path is `dist/animations/src/<project>.js`.

## Checklist for Tasks 3, 4, 6 and 7

1. Scope sed over `*.ts`, `*.tsx`, `*.json`, `*.meta` (and `*.md`, `*.lua`, `*.js` for prose or extension references where relevant).
2. Rewrite every `@canvas-commons/(2d|core)/lib/...` import to the package root.
3. `grep -rn "offset" ` in scene code: rename Node `offset*` to `anchor*`.
4. `animations/package.json`: `"type": "module"`, all `@canvas-commons/*` at `^0.4.0`, `editor` instead of `ui`, `lezer-r` here only.
5. `animations/tsconfig.json`: add `"skipLibCheck": true`.
6. Extension: `motion-canvas-player` element becomes `canvas-commons-player` in the Lua output, the CSS selector and the JS `querySelector` calls.
7. Do not edit the vite plugin default import; only the specifier changes.
