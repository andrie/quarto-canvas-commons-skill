# quarto-canvas-commons-skill

This repo holds Claude Code skills for building animated Canvas Commons (formerly Motion Canvas) scenes inside Quarto revealjs decks, pinned to Canvas Commons 0.4.0. It is not an application. The deliverable is the `skills/` folder, which gets symlinked into `~/.claude/skills`. `README.md` is for people installing the skills; this file is for whoever changes them.

## Layout

- `skills/motion-canvas-scene`: bootstrap a project or add Canvas Commons to an existing Quarto project, add or remove scenes, validate, screenshot a slide. Holds the vendored project template in `assets/project-template/`.
- `skills/motion-canvas-api`, `motion-canvas-authoring`, `motion-canvas-review`, `svg-to-motion-canvas`, `motion-canvas-r-code`: reference and pattern skills.
- `skills/canvas-commons-library`: a plain folder of shared TypeScript (styles, `Database`, `pulse`, scenes). It has no `SKILL.md` on purpose.
- `seed/`: worked examples the skills point at (scenes and draw.io diagrams). Not shipped as a skill. `seed/tour/` holds ten short scenes, one per capability, with the shared components they need.
- `tests/` and `scripts/`: the checks and the installer. `scripts/sync-extension.js` refreshes the template from the extension repo.
- `docs/superpowers/`: the design spec, the executed plan, and `notes/` (the rename spike, the staged `quarto-presentation` patch).

## Commands

- Tests: `TS_PATH=/path/to/node_modules/typescript node --test tests/*.test.js`. Use the glob, because `node --test tests/` fails on Node 22. `TS_PATH` can point at any `typescript` install; without it the generator tests fail on purpose (`SKIP_GENERATOR_TESTS=1` skips them visibly).
- Extension and starter project: the source is the `quarto-canvas-commons` repo (`../quarto-canvas-commons`, `https://github.com/andrie/quarto-canvas-commons`). `skills/motion-canvas-scene/assets/project-template/` is a generated copy of its `template/`. Refresh it with `node scripts/sync-extension.js --from ../quarto-canvas-commons` (or `--tag vX.Y.Z`), then `node scripts/record-known-copies.js`, and commit. `--check` fails in CI when the copy has drifted. Never edit the copy by hand: a fix made in a project or in the template would be overwritten, so make it in the extension repo. `animations/src/styles.ts` is the one file the skill owns inside the template.
- Known copies: after syncing a new extension version, run `node scripts/record-known-copies.js`. It adds the new hashes to `known-copies.json`, which is how `upgrade-project.js` recognises every copy ever shipped. Entries are only added, never removed. A test fails until it is done. Projects reach a change through `upgrade-project.js`, so a change that adds or retires a project file needs a step there too.
- Port check: `bash scripts/check-ported.sh`. It fails on `@motion-canvas/`, deep `lib/` imports, `offsetX`/`offsetY` node props and a drifted `Colors.TEXT`. Mark a deliberate mention with `PORT-NOTE`.
- Browser tests are opt-in: `CC_BROWSER_TESTS=1`, plus `PLAYWRIGHT_DIR` if Playwright is not in `~/.cache/canvas-commons-tools`. Chromium also needs `libasound.so.2`; `references/validate.md` has the no-sudo workaround.
- Template and bootstrap tests need `make`; real builds need node 22, npm and quarto.

## Rules

- Never run `scripts/install.sh` against the real home without asking. `~/.claude` is the git-synced claude-config working tree, so symlinks installed there show up as untracked changes that a sync could push. Use `--dry-run` first and `--uninstall` to remove. Test installer changes with `--target <tmp dir>`.
- Never edit the global `quarto-presentation` skill. The change is staged as a patch in `docs/superpowers/notes/quarto-presentation-additions/` and applying it is the owner's decision.
- Skill `description` fields state triggers only ("Use when..."), never the workflow.
- Never overwrite a user's files when bootstrapping into an existing project. Merge by the documented rules, or ask.
- Do not commit `.meta`, `dist/`, `node_modules/` or review reports. Building a library scene through the `animations/src/lib` symlink writes `.meta` files into the library, so `*.meta` is ignored there.
- New prose: UK English, no em-dashes, sentence-case headings, no hard-wrapping. Ported content keeps its original wrapping and headings.
- Check subagent reports against `git show --stat`; they have claimed commits that were not made and committed stray files.

## Canvas Commons 0.4.0 facts that are easy to get wrong

- Import everything from `@canvas-commons/core` or `@canvas-commons/2d`; the old `lib/...` subpaths are gone. `@canvas-commons/ui` does not exist, the package is `@canvas-commons/editor`.
- Node `offset` is now `anchor` (`anchorX`, `anchorY`). `Code` has no `language` prop; choose a highlighter with `highlighter={...}`.
- The extension is `canvas-commons` (shortcode `{{< canvas-commons >}}`, called `motion-canvas` before 0.4.0, which still works as an alias). The player element is `canvas-commons-player`. The extension ships the prebuilt player (`canvas-commons-bundle.js`), so the template has no root `package.json` or player build. The bundle's shim resolves the shortcode path `./animations/src/<name>.js` against the document's `dist/` folder, to the built file `dist/animations/src/<name>.js`; without the shim the path resolves against the bundle's own folder and the scene 404s.
- The player always starts when its slide is shown, unless the shortcode says `auto=false`. `width=` goes inside `style`, and the extension's meta tag `canvas-commons:offset` lets pages in a website subdirectory find `dist/`.
- `animations/package.json` needs `"type": "module"`, `lezer-r` lives there and not in the root `package.json`, and the shared library symlink needs `resolve.preserveSymlinks: true`.
- `lezer-r` 0.1.3 does attach highlight tags. The original reason the R scene was uncoloured is not established.
- The player runs on the real clock, so headless `--virtual-time-budget` screenshots capture only the first frames. Use `scripts/screenshot-slide.mjs`.

## Decisions and where they live

The spec (`docs/superpowers/specs/2026-10-06-quarto-canvas-commons-skill-design.md`) is out of date in places: the port was not rename-only, the canonical extension is the fork-era copy vendored in the template (the infosec copy is the pre-fork one), the upstream repo uses pnpm and not lerna, and `lezer-r` does attach tags. `docs/superpowers/notes/2026-10-06-rename-spike.md` records the real port rules. The template ships a snapshot copy of `styles.ts`; `canvas-commons-library/styles.ts` is canonical and a test keeps them identical.

## Open items

- `docs/superpowers/specs/2026-10-06-reusable-component-patterns-addendum.md` is untracked and unreviewed; leave it alone until its owner decides.
- Template: `.hidetitle` has no CSS in the template, so the class does nothing there. Removing the smoke slide has no command. The screenshot docs lack a pre-flight setup hint and advice on choosing `--at` offsets.
- The seed scenes build but were never played in a browser. `check-ported.sh` only checks `.ts` and `.tsx` for deep imports. `add-scene.js` prepends rather than appends. The `SKILL.md` files run from about 640 to 1040 words after the rarely needed sections moved into `references/`: `motion-canvas-api` and `motion-canvas-scene` are the longest.
- Commit trailers on the last six commits say Opus 5.5; earlier ones say Sonnet 5.5.
