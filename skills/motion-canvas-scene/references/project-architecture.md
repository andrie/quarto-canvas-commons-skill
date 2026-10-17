# Project architecture

The template in `assets/project-template/` is the minimal working version of everything described here. Its Quarto extension (`_extensions/andrie/motion-canvas/`) was updated for the Canvas Commons fork: the player element is `canvas-commons-player`, not `motion-canvas-player`. The shortcode name stays `motion-canvas`.

## One build, one extension

A Canvas Commons presentation project is a Quarto revealjs deck, the Quarto extension that embeds the player, and one small Vite project (`animations/`) that builds the scenes. The player is not built in the project: the extension ships it prebuilt.

| Part | Provides | Output |
|------|----------|--------|
| `_extensions/andrie/motion-canvas/` | `canvas-commons-bundle.js`, the player bundle that registers the `canvas-commons-player` custom element, and `motion-canvas-player.js`, which starts and stops players as slides change. The shortcode adds both to any deck that uses it. | Copied by Quarto into the deck's support folder (`<deck>_files/libs/quarto-contrib/`) |
| `animations/` (`package.json`, `vite.config.ts`, `tsconfig.json`) | The scenes, one JS file per project file registered in the `project` array of the Canvas Commons Vite plugin | `dist/animations/src/<name>.js`, plus shared chunks (`styles.js`, `_virtual_settings.js` and so on) |

The player bundle is built in this repo by `scripts/build-player.sh` from `scripts/player/`, pinned to one Canvas Commons version. A scene bundle must come from the same Canvas Commons version as the player, so the extension and the `@canvas-commons/*` pins in `animations/package.json` move together. Older projects built the bundle themselves into `dist/motion-canvas-ts.js` and loaded it with an `include-in-header` script: see "Moving a project to the bundled player" in `validate.md`.

The animation output path is `dist/animations/src/<name>.js`, because the animations build's `outDir` is `../dist/animations` and the project files live in `src/`. That build sets `emptyOutDir: true`, so each build first empties `dist/animations/` and a removed scene's bundle does not linger; without it Vite refuses to empty a directory outside `animations/` and prints "outDir ... is not inside project root and will not be emptied". Shortcode `src=` values must include `src/`, for example `{{< motion-canvas ./animations/src/smoke.js auto fullscreen=true >}}`. The bundle resolves a relative `src` against the document's `dist/` folder, not against the HTML page, so `./animations/src/smoke.js` fetches `dist/animations/src/smoke.js`. Leaving out `src/` (for example `./animations/smoke.js`) gives a blank player.

The `.qmd` needs one entry in its YAML header:

```yaml
format:
  revealjs:
    resources:
      - dist/**
```

`resources: dist/**` tells Quarto to treat the built scene files as site resources, so they are published alongside the deck (needed for `quarto publish` and project renders). The glob must be recursive: `dist/*/*` skips `dist/animations/src/`, where the scenes are, so a deployed deck loads the player but not its scene and shows nothing.

Only `dist/` (built with `make anim`) and the deck are needed on a host such as Posit Connect; `_extensions/` and `node_modules/` are not, because Quarto copies the player bundle into the rendered output. `dist/` is gitignored, so a git-based deploy misses it unless it is built first. A Posit Publisher config lists its files, and the list must include `/dist`. A second config for another deck does not inherit it.

Each project file `animations/src/<name>.ts` imports its scene with the `?scene` suffix, for example `import smoke from './scenes/smoke?scene'`, which tells Vite to treat the file as a scene. Each project file needs a matching registration in `animations/vite.config.ts`, or it is never built.

## How the Makefile ties them together

All the build logic lives in the project's `Makefile`, and every target has a comment. It sets `QMD_FILE = <deck>` and `PORT`, which the render and preview targets use.

| Target | Does |
|--------|------|
| `make anim` | Builds `animations/` if its sources changed |
| `make force-build` | Deletes the marker file, then runs `make anim` |
| `make quarto` | `anim`, then `quarto render` on the deck |
| `make preview` | `anim`, then `quarto preview` on port 4200 |
| `make publish` | `anim`, then render and `quarto publish` the deck |
| `make serve` | The Canvas Commons editor with hot reload (`npm --prefix ./animations run serve`) |
| `make install` | `npm install` in `animations/` |
| `make clean` | `rm -rf dist` |

Incremental builds use one timestamp marker, `dist/animations/.build-complete`. It is touched after a successful build, and `make` rebuilds only when a source file (or `animations/package.json` or the vite config) is newer than it. The build watches every `.ts`, `.tsx` and `.js` file under `animations/src`, following symlinks (`find -L`), so a linked shared library counts. Deleting `dist/` removes the marker, so the next `make anim` rebuilds everything.

`animations/` builds with `tsc && vite build`, so type errors fail the build before Vite runs. The deck is `QMD_FILE`: change that variable to render a different deck.

## Known quirk: lezer-r placement

`lezer-r` (the R grammar used for syntax highlighting) belongs in `animations/package.json` only. The scenes import it, and the scenes build in `animations/`. Older versions of this project carried it in the root `package.json` too, which does nothing: nothing at the root imports it. If `Cannot find module 'lezer-r'` appears during `make anim`, install it in the animations tree: `npm --prefix ./animations install lezer-r`.

The template already lists `lezer-r` in `animations/package.json`, although the smoke scene does not import it, so scenes that highlight R code work without further setup. If a scene needs R highlighting, it also needs a declaration file (`declare module 'lezer-r'`) in `animations/src`, as noted in the `SKILL.md` error tables.

## Package scope

Everything uses the `@canvas-commons/*` scope at `^0.4.0` (the fork of Motion Canvas). `@canvas-commons/editor` replaces the old `ui` package and must be listed in `animations/package.json` (the Vite plugin needs it but does not declare it). `animations/package.json` needs `"type": "module"` and `animations/tsconfig.json` needs `"skipLibCheck": true`. The error tables in `SKILL.md` cover what happens without them.
