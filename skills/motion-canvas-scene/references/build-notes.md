# Images, deployment and dependencies

Notes moved out of `SKILL.md`. Read the one that matches the task.

## Images in scenes

Put images in `animations/src/assets/` and import them: `import logo from '../assets/logo.svg'`, then `<Img src={logo} />`. The build emits each image as a file in `dist/animations/`, and the template's `base: "./"` in `animations/vite.config.ts` makes the bundle find it there. Keep that setting: without it the animation is black in the rendered deck, with no build error, although `make serve` shows it. Do not try `assetsInlineLimit` or the `?inline` suffix: neither inlines the file in Vite 4.

## Deploying to Posit Connect

- Build first with `make anim`, then render and publish. `dist/` is gitignored, so a git-based deploy misses it unless it is built in the pipeline.
- The host needs only `dist/` and the rendered deck. It does not need `_extensions/` or `node_modules/`: Quarto copies the player bundle into the rendered output.
- The deck's `resources` entry must be `dist/**`. The older `dist/*/*` skips `dist/animations/src/`, so the deck loads but the scene 404s and the slides show nothing (the browser's network tab shows the 404 for `dist/animations/src/<name>.js`).
- A Posit Publisher config lists its files, and the list must include `/dist`. A second config for another deck does not inherit it.
- Check before publishing: `quarto render <deck> --output-dir /tmp/cc-out && ls /tmp/cc-out/dist/animations/src`. After deploying, `curl` the live `dist/animations/src/<name>.js`.

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
