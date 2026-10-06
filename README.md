# quarto-canvas-commons-skill

Claude Code skills for building animated Canvas Commons (formerly Motion Canvas) scenes inside Quarto revealjs decks. Canvas Commons is pinned at 0.4.0.

## The six skills

- `motion-canvas-scene`: bootstrap a project from a template or add Canvas Commons to an existing Quarto project (it asks for the deck name and merges into an existing `Makefile`, `package.json` and `.gitignore` without overwriting them), add or remove scenes (`scripts/add-scene.js`, and `scripts/remove-scene.js`, which also deletes the scene's `.meta` files and built bundle), validate a project (including a check that `animations/vite.config.ts` empties `dist/animations/` on rebuild), take screenshots of a rendered slide to check a scene visually (`scripts/screenshot-slide.mjs`, which needs Playwright outside the project), fix build errors.
- `motion-canvas-authoring`: layout, timing and style patterns for composing a scene, including an application window mockup (`references/app-window-mockup.md`).
- `svg-to-motion-canvas`: translate a draw.io or SVG diagram into a scene. Worked examples come from `seed/`.
- `motion-canvas-r-code`: R and Python syntax highlighting and fonts for `Code` nodes.
- `motion-canvas-api`: a searchable 0.4.0 API index and cheat sheet.
- `canvas-commons-library`: shared styles, the `Database` component, `pulse` and reusable scenes.

## Install

```bash
bash scripts/install.sh              # symlink each skill into ~/.claude/skills
bash scripts/install.sh --dry-run    # show what would happen, change nothing
bash scripts/install.sh --uninstall  # remove only symlinks that point into this repo
```

An existing real directory is never touched. An existing symlink that points somewhere else is skipped unless you pass `--force`. Use `--target DIR` to install somewhere other than `~/.claude/skills`.

**Warning:** `~/.claude` is the git-synced claude-config working tree. Installing symlinks there shows up as untracked changes that a later sync could push to the shared repository. Check `git status` in `~/.claude` before you sync.

## Tests

```bash
TS_PATH=/path/to/node_modules/typescript node --test tests/*.test.js
bash scripts/check-ported.sh
```

Use the glob: `node --test tests/` does not work on Node 22. The template tests need `make`. `tests/fixtures/existing-projects/` holds two tiny existing projects (one with its own Makefile, `package.json` and root `vite.config.ts`, one plain Quarto deck) for trying the "add to an existing project" procedure by hand. `TS_PATH` points at a `typescript` package, which the API generator tests need. `check-ported.sh` fails on stale `@motion-canvas/` references, deep `lib/` imports and `offsetX`/`offsetY` node props.

The two browser tests in `tests/screenshot-slide.test.js` are skipped unless you set `CC_BROWSER_TESTS=1`. They drive `screenshot-slide.mjs` against `tests/fixtures/screenshot/fake-deck.html` and need Playwright with Chromium, found the same way the script finds it: `PLAYWRIGHT_DIR`, or `~/.cache/canvas-commons-tools` (the script's error message gives the one-off install command).

```bash
CC_BROWSER_TESTS=1 PLAYWRIGHT_DIR=/path/to/dir-with-node_modules node --test tests/screenshot-slide.test.js
```

## Not applied

The staged patch for the global `quarto-presentation` skill, in `docs/superpowers/notes/quarto-presentation-additions/`, is not applied. Its `README.md` says how to apply it.
