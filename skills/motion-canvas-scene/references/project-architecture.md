# Project architecture

A Canvas Commons presentation project is a Quarto revealjs deck plus two small Vite projects that build the animations it embeds. The template in `assets/project-template/` is the minimal working version of everything described here. Its Quarto extension (`_extensions/andrie/motion-canvas/`) was updated for the Canvas Commons fork: the player element is `canvas-commons-player`, not `motion-canvas-player`. The shortcode name stays `motion-canvas`.

## Two projects, one dist folder

The root project and `animations/` have separate `package.json` files, separate `node_modules`, and separate Vite configs. Both write into the root `dist/` folder.

The root player config is `vite.player.config.ts`, built with `vite build -c vite.player.config.ts` (the `build:player` script), so it never collides with a project's own `vite.config.ts`. Projects from an older template have a root `vite.config.ts` and a `build` script instead; they still work.

| Project | Builds | Output |
|---------|--------|--------|
| Root (`package.json` script `build:player`, `vite.player.config.ts`, `motion-canvas-ts.html`, `src/main.ts`) | The player bundle: `src/main.ts` imports `@canvas-commons/core` and `@canvas-commons/player`, which registers the `canvas-commons-player` custom element | `dist/motion-canvas-ts.js` |
| `animations/` (`package.json`, `vite.config.ts`, `tsconfig.json`) | The scenes, one JS file per project file registered in the `project` array of the Canvas Commons Vite plugin | `dist/animations/src/<name>.js`, plus shared chunks (`styles.js`, `_virtual_settings.js` and so on) |

The animation output path is `dist/animations/src/<name>.js`, because the animations build's `outDir` is `../dist/animations` and the project files live in `src/`. That build sets `emptyOutDir: true`, so each build first empties `dist/animations/` and a removed scene's bundle does not linger; without it Vite refuses to empty a directory outside `animations/` and prints "outDir ... is not inside project root and will not be emptied". The player build sets `emptyOutDir: false`, so neither build deletes the other's output. Shortcode `src=` values must include `src/`, for example `{{< motion-canvas ./animations/src/smoke.js auto fullscreen=true >}}`. The player resolves `src` relative to the player bundle (`dist/motion-canvas-ts.js`), not relative to the HTML page, so `./animations/src/smoke.js` fetches `dist/animations/src/smoke.js`. Leaving out `src/` (for example `./animations/smoke.js`) gives a blank player.

The `.qmd` loads the player bundle once, in the YAML header:

```yaml
format:
  revealjs:
    resources:
      - dist/**
    include-in-header:
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

`resources: dist/**` tells Quarto to treat the built scene files as site resources, so they are published alongside the deck (needed for `quarto publish` and project renders). The glob must be recursive: `dist/*/*` skips `dist/animations/src/`, where the scenes are, so a deployed deck loads the player but not its scene and shows nothing.

Only `dist/` (built with `make anim`), `_extensions/`, `motion-canvas-ts.html` and the deck are needed on a host such as Posit Connect; `node_modules/` is not. `dist/` is gitignored, so a git-based deploy misses it unless it is built first. A Posit Publisher config lists its files, and the list must include `/dist` and `/motion-canvas-ts.html`. A second config for another deck does not inherit them.

Each project file `animations/src/<name>.ts` imports its scene with the `?scene` suffix, for example `import smoke from './scenes/smoke?scene'`, which tells Vite to treat the file as a scene. Each project file needs a matching registration in `animations/vite.config.ts`, or it is never built.

## How the Makefile ties them together

All the build logic lives in the project's `Makefile`, and every target has a comment. It sets `QMD_FILE = <deck>` and `PORT`, which the render and preview targets use.

| Target | Does |
|--------|------|
| `make anim` | Builds the root project, then `animations/`, each only if its sources changed |
| `make force-build` | Deletes both marker files, then runs `make anim` |
| `make quarto` | `anim`, then `quarto render` on the deck |
| `make preview` | `anim`, then `quarto preview` on port 4200 |
| `make publish` | `anim`, then render and `quarto publish` the deck |
| `make serve` | The Canvas Commons editor with hot reload (`npm --prefix ./animations run serve`) |
| `make install` | `npm install` in the root and in `animations/` |
| `make clean` | `rm -rf dist` |

Incremental builds use two timestamp markers, `dist/.build-complete` (root) and `dist/animations/.build-complete` (animations). Each is touched after a successful build, and `make` rebuilds that half only when a source file (or `package.json` or the vite config) is newer than its marker. The root half watches `package.json`, `vite.player.config.ts`, `motion-canvas-ts.html` and `src/*.ts`. The animations half watches every `.ts`, `.tsx` and `.js` file under `animations/src`, following symlinks (`find -L`), so a linked shared library counts. Deleting `dist/` removes the markers, so the next `make anim` rebuilds everything.

`animations/` builds with `tsc && vite build`, so type errors fail the build before Vite runs. The deck is `QMD_FILE`: change that variable to render a different deck.

## Known quirk: lezer-r placement

`lezer-r` (the R grammar used for syntax highlighting) belongs in `animations/package.json` only. The scenes import it, and the scenes build in `animations/`. Older versions of this project carried it in the root `package.json` too, which does nothing: the root project only builds the player bundle and never imports it. If `Cannot find module 'lezer-r'` appears during `make anim`, install it in the animations tree: `npm --prefix ./animations install lezer-r`.

The template already lists `lezer-r` in `animations/package.json`, although the smoke scene does not import it, so scenes that highlight R code work without further setup. If a scene needs R highlighting, it also needs a declaration file (`declare module 'lezer-r'`) in `animations/src`, as noted in the `SKILL.md` error tables.

## Package scope

Everything uses the `@canvas-commons/*` scope at `^0.4.0` (the fork of Motion Canvas). `@canvas-commons/editor` replaces the old `ui` package and must be listed in `animations/package.json` (the Vite plugin needs it but does not declare it). `animations/package.json` needs `"type": "module"` and `animations/tsconfig.json` needs `"skipLibCheck": true`. The error tables in `SKILL.md` cover what happens without them.
