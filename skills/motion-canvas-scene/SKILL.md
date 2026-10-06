---
name: motion-canvas-scene
description: Use when creating, building or debugging Canvas Commons (formerly Motion Canvas) scenes in a Quarto project.
---

# Creating, Building, and Debugging Scenes

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

## Creating a New Scene

### Step 1: Create the scene file

`animations/src/scenes/<name>.tsx`:

```typescript
import {makeScene2D} from '@canvas-commons/2d';
import {createRef, waitFor, all} from '@canvas-commons/core';
import {Rect, Txt} from '@canvas-commons/2d';
import {Posit, Colors} from '../styles';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();

  view.add(
    <Rect ref={rect} width={200} height={200} fill={Posit.blue} scale={0} />
  );

  yield* rect().scale(1, 1);
  yield* waitFor(2);
});
```

### Step 2: Create the project file

`animations/src/<name>.ts`:

```typescript
import {makeProject} from '@canvas-commons/core';
import scene from './scenes/<name>?scene';

export default makeProject({
  scenes: [scene],
});
```

The `?scene` suffix is required — it tells vite to process the file as a Motion Canvas scene.

### Step 3: Register in vite config

Add to the `project` array in `animations/vite.config.ts`:

```typescript
motionCanvas({
  project: [
    "./src/hexagons.ts",
    "./src/posit_footer.ts",
    // ... existing entries ...
    "./src/<name>.ts",   // <-- add here
  ],
}),
```

### Step 4: Build to validate

```bash
make anim
```

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

Output goes to `dist/animations/src/<name>.js` — this is what the Quarto shortcode references.

## Common Errors and Fixes

### TypeScript errors (from `tsc`)

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module './scenes/<name>?scene'` | Scene file doesn't exist or path is wrong | Check filename matches import in .ts project file |
| `Type 'X' is not assignable to type 'Y'` | Wrong property type | Check API for correct type (e.g., number vs string) |
| `Property 'X' does not exist on type 'Y'` | Typo in property name or missing import | Check node type supports the property. `offset`, `offsetX` and `offsetY` are now `anchor`, `anchorX` and `anchorY` |
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
| Blank animation player | Wrong `src` path in shortcode | Check path matches `dist/animations/src/<name>.js` |
| Animation doesn't appear | JS not loaded | Verify `include-in-header` in .qmd YAML has the script tag |
| Colors wrong | Hardcoded hex instead of style constants | Use `Posit.blue`, `Colors.KEYWORD` etc. from styles.ts |

## Style Configuration

**Always read these files at runtime** for current values:

### `animations/src/styles.ts`

Contains:
- `Colors` object: background, surface, syntax highlighting colors (KEYWORD, TEXT, FUNCTION, STRING, NUMBER, PROPERTY, COMMENT), basic colors (red, green, blue, white, black)
- `Posit` object: brand colors (blue `#447099`, orange `#EE6331`, gray `#404041`, white, teal `#419599`, green `#72994E`, burgundy `#9A4665`)
- `BaseFont`: `{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 28 }`
- `WhiteLabel`, `BlackLabel`: preset text styles

### `theme.scss`

Contains:
- Posit blue shades: LIGHT-BLUE-1 through Dark-Blue-3
- Gray shades: Light-Gray-3 through Dark-Gray-3
- Font imports: Open Sans, Source Code Pro
- Heading styles: font weights, sizes, colors

## Existing Components and Utilities

### Custom components (`animations/src/components/`)

- **Database** — 3D database cylinder (top ellipse + bottom half-ellipse + vertical sides). Props: `size`, `stroke`, `lineWidth`, `position`. Extends Layout.
- **RHighlighter** — Custom syntax highlighter for R code. Maps Lezer parser node types directly to colors. More reliable than LezerHighlighter for languages with limited semantic highlighting.

### Animation utilities (`animations/src/utils/`)

- **pulse** — Scale up then down for emphasis. `yield* pulse(element, { scaleGrowth: 0.1, duration: 0.5 })`

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
