# canvas-commons-library

Shared styles, components, scenes and utilities for Canvas Commons (0.4.0) animation projects.

## Contents

- `styles.ts`: `Posit`, `Colors`, `BaseFont`, `WhiteLabel`, `BlackLabel`. `Colors.TEXT` is `#ACB3BF`.
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

From a file in `animations/src/scenes/`, use `../lib/styles` and so on.

Every `@canvas-commons/*` import in the library uses the package root, as 0.4.0 does not expose `lib/...` subpaths. The project needs `skipLibCheck: true` in `animations/tsconfig.json`.
