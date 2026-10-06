# canvas-commons-library

Shared styles, components, scenes and utilities for Canvas Commons (0.4.0) animation projects.

## Contents

- `styles.ts`: `Posit`, `Colors`, `BaseFont`, `WhiteLabel`, `BlackLabel`. `Colors.TEXT` is `#ACB3BF`. This file is canonical: the `motion-canvas-scene` project template ships a snapshot copy at `animations/src/styles.ts`, so a bootstrapped project has styles without the symlink, and a test checks that the two are byte-identical. Change this file and the template copy together.
- `components/Database.tsx`: the `Database` node.
- `scenes/`: reusable scenes (`hexagons`, `pipeline`, `posit_footer`, `quarto_mc`). They import `../styles` and `../components/Database`, so they work unchanged through the symlink below.
- `utils/pulse.ts`: `pulse(node, {scaleGrowth, duration})`, which scales a node up and then back.

## Importing from a project

Symlink the library into the animations source tree, so imports stay short and do not depend on where the skill is installed:

```bash
ln -s ~/.claude/skills/canvas-commons-library animations/src/lib
```

Then import from `./lib/...` (adjust the relative path for the importing file):

```ts
import {Posit, Colors, BaseFont} from './lib/styles';
import {Database} from './lib/components/Database';
import {pulse} from './lib/utils/pulse';
```

From a file in `animations/src/scenes/`, use `../lib/styles` and so on. In a bootstrapped project `../styles` (the template snapshot) works as well, without the symlink.

The symlink holds an absolute path, so it dangles on another machine. The project template's `.gitignore` lists `animations/src/lib` so it is never committed; re-create it with the `ln -s` command on each machine.

The symlink install needs `resolve: { preserveSymlinks: true }` in `animations/vite.config.ts` (the `motion-canvas-scene` template already sets it). Without it `vite build` fails because rollup resolves the real path of a library file and then cannot resolve `@canvas-commons/2d` or `@canvas-commons/core` from it (the error reads "Rollup failed to resolve import").

Every `@canvas-commons/*` import in the library uses the package root, as 0.4.0 does not expose `lib/...` subpaths. The project needs `skipLibCheck: true` in `animations/tsconfig.json`.

## Registering a library scene

A library scene is a scene module, not a project file. Create a project file that imports it with the `?scene` suffix, then register that project file with Vite. For `hexagons`, write `animations/src/hexagons.ts`:

```ts
import {makeProject} from '@canvas-commons/core';
import hexagons from './lib/scenes/hexagons?scene';

export default makeProject({
  scenes: [hexagons],
});
```

Then register `./src/hexagons.ts` in the `project` array of `animations/vite.config.ts`, either by hand or by running `node ~/.claude/skills/motion-canvas-scene/scripts/add-scene.js hexagons` and then replacing the scene import in the generated `animations/src/hexagons.ts` with the one above. Note that `add-scene.js` also writes a skeleton `animations/src/scenes/hexagons.tsx`, which you can delete once the project file no longer imports it. Build with `make anim` and reference `./animations/src/hexagons.js` in the shortcode.
