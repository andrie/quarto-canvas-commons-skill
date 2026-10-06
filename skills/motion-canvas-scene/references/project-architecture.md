# Project architecture

A Canvas Commons presentation project is a Quarto revealjs deck plus two small Vite projects that build the animations it embeds. The template in `assets/project-template/` is the minimal working version of everything described here. Its Quarto extension (`_extensions/andrie/motion-canvas/`) was updated for the Canvas Commons fork: the player element is `canvas-commons-player`, not `motion-canvas-player`. The shortcode name stays `motion-canvas`.

## Two projects, one dist folder

The root project and `animations/` have separate `package.json` files, separate `node_modules`, and separate Vite configs. Both write into the root `dist/` folder.

| Project | Builds | Output |
|---------|--------|--------|
| Root (`package.json`, `vite.config.ts`, `motion-canvas-ts.html`, `src/main.ts`) | The player bundle: `src/main.ts` imports `@canvas-commons/core` and `@canvas-commons/player`, which registers the `canvas-commons-player` custom element | `dist/motion-canvas-ts.js` |
| `animations/` (`package.json`, `vite.config.ts`, `tsconfig.json`) | The scenes, one JS file per project file registered in the `project` array of the Canvas Commons Vite plugin | `dist/animations/src/<name>.js`, plus shared chunks (`styles.js`, `_virtual_settings.js` and so on) |

The animation output path is `dist/animations/src/<name>.js`, because the Rollup output directory is `../dist/animations` and the project files live in `src/`. Shortcode `src=` values must include `src/`, for example `{{< motion-canvas ./animations/src/smoke.js auto fullscreen=true >}}`. The player resolves `src` relative to the player bundle (`dist/motion-canvas-ts.js`), not relative to the HTML page, so `./animations/src/smoke.js` fetches `dist/animations/src/smoke.js`. Leaving out `src/` (for example `./animations/smoke.js`) gives a blank player.

The `.qmd` loads the player bundle once, in the YAML header:

```yaml
format:
  revealjs:
    resources:
      - dist/*/*
    include-in-header:
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

`resources: dist/*/*` tells Quarto to treat the built scene files as site resources, so they are published alongside the deck (needed for `quarto publish` and project renders).

Each project file `animations/src/<name>.ts` imports its scene with the `?scene` suffix, for example `import smoke from './scenes/smoke?scene'`, which tells Vite to treat the file as a scene. Each project file needs a matching registration in `animations/vite.config.ts`, or it is never built.

## How the Makefile ties them together

| Target | Does |
|--------|------|
| `make anim` (alias of `make build`) | Builds the root project, then `animations/`, each only if its sources changed |
| `make force-build` | Deletes both marker files, then runs `make build` |
| `make quarto` | `make anim`, then `quarto render` on `QMD_FILE` |
| `make preview` | `make anim`, then `quarto preview` on port 4200 |
| `make serve` | The Canvas Commons editor with hot reload (`npm --prefix ./animations run serve`) |
| `make install` | `npm install` in the root and in `animations/` |
| `make clean` | `rm -rf dist` |

Incremental builds use two timestamp markers, `dist/.build-complete` (root) and `dist/animations/.build-complete` (animations). Each is touched after a successful build, and `make` rebuilds that half only when a source file (or `package.json` or the vite config) is newer than its marker. The root half watches `*.ts`, `*.js`, `package.json` and `vite.config.*` in the root folder only, so an edit to `src/main.ts` does not trigger a root rebuild: use `make force-build`. The animations half watches every `.ts`, `.tsx` and `.js` file under `animations/src`, following symlinks (`find -L`), so a linked shared library counts. Deleting `dist/` removes the markers, so the next `make anim` rebuilds everything.

`animations/` builds with `tsc && vite build`, so type errors fail the build before Vite runs. The `QMD_FILE` variable at the top of the Makefile names the deck that `make quarto` renders: change it when you rename `smoke.qmd`.

## Known quirk: lezer-r placement

`lezer-r` (the R grammar used for syntax highlighting) belongs in `animations/package.json` only. The scenes import it, and the scenes build in `animations/`. Older versions of this project carried it in the root `package.json` too, which does nothing: the root project only builds the player bundle and never imports it. If `Cannot find module 'lezer-r'` appears during `make anim`, install it in the animations tree: `npm --prefix ./animations install lezer-r`.

The template already lists `lezer-r` in `animations/package.json`, although the smoke scene does not import it, so scenes that highlight R code work without further setup. If a scene needs R highlighting, it also needs a declaration file (`declare module 'lezer-r'`) in `animations/src`, as noted in the `SKILL.md` error tables.

## Package scope

Everything uses the `@canvas-commons/*` scope at `^0.4.0` (the fork of Motion Canvas). `@canvas-commons/editor` replaces the old `ui` package and must be listed in `animations/package.json` (the Vite plugin needs it but does not declare it). `animations/package.json` needs `"type": "module"` and `animations/tsconfig.json` needs `"skipLibCheck": true`. The error tables in `SKILL.md` cover what happens without them.
