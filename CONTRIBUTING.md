# Contributing

This repo is a set of Claude Code skills, not an application. The deliverable is the `skills/` folder. `README.md` is for people installing the skills, and this file is for whoever changes them. `CLAUDE.md` holds the same rules in the form Claude Code reads, plus the Canvas Commons 0.4.0 facts that are easy to get wrong.

## Layout

- `skills/motion-canvas-scene`: bootstrap, add and remove scenes, validate, screenshot. Holds the vendored project template in `assets/project-template/`
- `skills/motion-canvas-api`, `motion-canvas-authoring`, `motion-canvas-review`, `svg-to-motion-canvas`, `motion-canvas-r-code`: reference and pattern skills
- `skills/canvas-commons-library`: a plain folder of shared TypeScript. It has no `SKILL.md` on purpose
- `seed/`: worked examples the skills point at. Not shipped as a skill
- `tests/` and `scripts/`: the checks and the installer
- `docs/superpowers/`: the design spec, the executed plan, and notes on the rename spike and the staged `quarto-presentation` patch

## Run the tests

```bash
TS_PATH=/path/to/node_modules/typescript node --test tests/*.test.js
bash scripts/check-ported.sh
```

Use the glob, because `node --test tests/` does not work on Node 22. `TS_PATH` points at any `typescript` install, which the API generator tests need. Without it they fail on purpose, and `SKIP_GENERATOR_TESTS=1` skips them visibly. The template tests need `make`, and real builds need node 22, npm and quarto.

`check-ported.sh` fails on stale `@motion-canvas/` references, deep `lib/` imports, `offsetX` and `offsetY` node props, and a drifted `Colors.TEXT`. Mark a deliberate mention with `PORT-NOTE`.

`tests/fixtures/existing-projects/` holds two tiny projects for trying the "add to an existing project" procedure by hand. One has its own Makefile, `package.json` and root `vite.config.ts`, and one is a plain Quarto deck.

### Browser tests

The two browser tests in `tests/screenshot-slide.test.js` are skipped unless you set `CC_BROWSER_TESTS=1`. They drive `screenshot-slide.mjs` against `tests/fixtures/screenshot/fake-deck.html` and need Playwright with Chromium, found the same way the script finds it: `PLAYWRIGHT_DIR`, or `~/.cache/canvas-commons-tools`. The script's error message gives the one-off install command.

```bash
CC_BROWSER_TESTS=1 PLAYWRIGHT_DIR=/path/to/dir-with-node_modules node --test tests/screenshot-slide.test.js
```

Chromium also needs `libasound.so.2`. `skills/motion-canvas-scene/references/validate.md` has a workaround that needs no sudo.

## Rules for changes

- Write a skill `description` as triggers only ("Use when..."), never as the workflow
- Never overwrite a user's files when bootstrapping into an existing project. Merge by the documented rules, or ask
- Do not commit `.meta`, `dist/`, `node_modules/` or review reports
- Write new prose in UK English, with no em-dashes, sentence-case headings and no hard-wrapping. Ported content keeps its original wrapping and headings
- Test installer changes with `--target <tmp dir>`, never against your real home. Run `scripts/install.sh --dry-run` first
- Do not edit the global `quarto-presentation` skill. The change is staged as a patch in `docs/superpowers/notes/quarto-presentation-additions/`, and its `README.md` says how to apply it

## Decisions

The design spec in `docs/superpowers/specs/` is out of date in places. The port from Motion Canvas was not rename-only, and `docs/superpowers/notes/2026-10-06-rename-spike.md` records the real port rules. The template ships a snapshot copy of `styles.ts`, while `canvas-commons-library/styles.ts` is canonical, and a test keeps the two identical.
