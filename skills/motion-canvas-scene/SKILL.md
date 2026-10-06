---
name: motion-canvas-scene
description: Use when starting a new Quarto presentation project that will contain Canvas Commons (Motion Canvas) animations, when adding, creating or removing a scene in an existing project, when checking that such a project builds, or when a scene fails to build or render.
---

# Creating, Building, and Debugging Scenes

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

## Starting or checking a project

- New presentation project (an empty directory, or "set up a project for animated slides"): follow `references/bootstrap.md`. It copies the template in `assets/project-template/`, installs, builds and renders a smoke deck.
- "Does my project work?", or an animation fails to build or render: follow `references/validate.md`, a read-only checklist that stops at the first failure and points back to the error tables below.
- How the root project, `animations/` and the Makefile fit together: `references/project-architecture.md`.

## Creating a new scene

1. Check `canvas-commons-library` first: the animation you want may already exist there.
2. Run the script from the project root (the directory with the `Makefile`):

   ```bash
   node ~/.claude/skills/motion-canvas-scene/scripts/add-scene.js <name>
   ```

   It writes `animations/src/scenes/<name>.tsx` (a skeleton scene) and `animations/src/<name>.ts` (the project file, with the required `?scene` import), and registers `./src/<name>.ts` in the `project` array of `animations/vite.config.ts`. It refuses to overwrite an existing scene. Use `--root <animationsDir>` when you are not in the project root.
3. Edit the scene, then build:

   ```bash
   make anim
   ```

   Reference the result in the deck as `{{< motion-canvas ./animations/src/<name>.js auto fullscreen=true >}}`.

To delete a scene, run `node ~/.claude/skills/motion-canvas-scene/scripts/remove-scene.js <name>`. It removes both files and the registration.

The script prevents the two registration errors in the tables below (a missing `?scene` import and an unregistered project file).

## Build Commands

| Command | Description |
|---------|-------------|
| `make anim` | Incremental build (preferred — skips if sources unchanged) |
| `make force-build` | Full rebuild (ignores timestamps) |
| `npm --prefix ./animations run build` | Direct build (runs `tsc && vite build`) |
| `make serve` | Live preview with hot reload (vite dev server) |
| `make quarto` | Build animations + render Quarto presentation |
| `make preview` | Build animations + live Quarto preview on port 4200 |

The build pipeline runs:
1. **`tsc`** — TypeScript compilation (catches type errors)
2. **`vite build`** — bundling to `dist/animations/src/` (catches import/config errors)

Output goes to `dist/animations/src/<name>.js`. The shortcode references it as `./animations/src/<name>.js`, which the player resolves relative to `dist/`.

## Common Errors and Fixes

### TypeScript errors (from `tsc`)

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module './scenes/<name>?scene'` | Scene file doesn't exist or path is wrong | Check filename matches import in .ts project file |
| `Type 'X' is not assignable to type 'Y'` | Wrong property type | Check API for correct type (e.g., number vs string) |
| `Property 'X' does not exist on type 'Y'` | Typo in property name or missing import | Check node type supports the property. `offset`, `offsetX` and `offsetY` are now `anchor`, `anchorX` and `anchorY` | <!-- PORT-NOTE: deliberate migration note -->
| `Cannot find module '@canvas-commons/2d/lib/components'` (or any `lib/...` path) | 0.4.0 has no deep imports; the package `exports` map only exposes the root | Import from `@canvas-commons/2d` or `@canvas-commons/core`. Fix these first: they cascade into misleading errors such as `Property 'width' does not exist on type 'Database'` |
| `Could not find a declaration file for module 'chroma-js'` or `Export assignment cannot be used when targeting ECMAScript modules` | Type errors inside the library's own `.d.ts` files | Set `"skipLibCheck": true` in `animations/tsconfig.json` |
| `Implicit 'any' type` for community parsers | Missing type declarations for `lezer-r` etc. | Add a `.d.ts` file: `declare module 'lezer-r' { ... }` |

### Vite errors (from `vite build`)

| Error | Cause | Fix |
|-------|-------|-----|
| `Could not resolve './src/<name>.ts'` | Project file not registered in vite.config.ts | Add to `project` array |
| `Failed to resolve import` | Missing npm dependency | Run `npm --prefix ./animations install <package>` |
| `"@canvas-commons/vite-plugin" resolved to an ESM file. ESM file cannot be loaded by require` | The plugin is ESM-only and `animations/package.json` has no `"type": "module"` | Add `"type": "module"` to `animations/package.json` |
| `Cannot find module '@canvas-commons/editor'` | The vite plugin needs the editor package but does not declare it | Add `@canvas-commons/editor` to `devDependencies` in `animations/package.json` |

### Runtime errors (in browser)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank animation player | Wrong `src` path in shortcode | The shortcode path must be `./animations/src/<name>.js`; the player resolves it relative to `dist/`, so it must map to the built file `dist/animations/src/<name>.js` |
| Animation doesn't appear | JS not loaded | Verify `include-in-header` in .qmd YAML has the script tag |
| Colors wrong | Hardcoded hex instead of style constants | Use `Posit.blue`, `Colors.KEYWORD` etc. from styles.ts |

## Style configuration

A bootstrapped project ships `animations/src/styles.ts`, a snapshot copy of `canvas-commons-library/styles.ts` (the library file is canonical, and a test keeps the two identical). **Read it at runtime** for current values. From a scene in `animations/src/scenes/`, import it as `../styles`.

It contains:
- `Colors` object: background, surface, syntax highlighting colours (KEYWORD, TEXT, FUNCTION, STRING, NUMBER, PROPERTY, COMMENT), basic colours (red, green, blue, white, black)
- `Posit` object: brand colours (blue `#447099`, orange `#EE6331`, gray `#404041`, white, teal `#419599`, green `#72994E`, burgundy `#9A4665`)
- `BaseFont`: `{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 28 }`
- `WhiteLabel`, `BlackLabel`: preset text styles

The template has no `theme.scss`. Deck theming (Posit blue shades, fonts, heading styles) is a Quarto deck matter: hand it to the `quarto-presentation` skill.

## Shared components and utilities

A bootstrapped project has none of these by default. They come from the optional library symlink, `animations/src/lib` (see `references/bootstrap.md`, step 6, and the `canvas-commons-library` README). Import from `./lib/...`, or `../lib/...` from a scene.

- **Database** (`../lib/components/Database`): a 3D database cylinder (top ellipse, bottom half-ellipse, vertical sides). Props: `size`, `stroke`, `lineWidth`, `position`. Extends Layout.
- **pulse** (`../lib/utils/pulse`): scales an element up then down for emphasis. `yield* pulse(element, { scaleGrowth: 0.1, duration: 0.5 })`
- **Library scenes** (`../lib/scenes/...`): ready-made scenes such as `hexagons`. See the library README for how to register one.
- **RHighlighter**: not in the library. It is a syntax highlighter for R code that ships with the `motion-canvas-r-code` skill, which has its own setup steps.

## Project Dependencies

Key packages in `animations/package.json`:
- `@canvas-commons/2d` ^0.4.0 — 2D renderer
- `@canvas-commons/core` ^0.4.0 — core animation engine
- `@canvas-commons/ffmpeg` ^0.4.0 — video export
- `@canvas-commons/vite-plugin` ^0.4.0 — vite integration (dev dependency)
- `@canvas-commons/editor` ^0.4.0 — editor UI, required by the vite plugin (dev dependency)
- `@lezer/javascript` — JS/TS syntax highlighting
- `lezer-r` — R syntax highlighting (community, needs .d.ts)
- `typescript` ^5.2.2
- `vite` ^4.5.0

Also required in `animations/`: `"type": "module"` in `package.json` (the vite plugin is ESM-only), and `"skipLibCheck": true` under `compilerOptions` in `tsconfig.json`, which extends `@canvas-commons/2d/tsconfig.project.json`. Docs: https://canvascommons.io
