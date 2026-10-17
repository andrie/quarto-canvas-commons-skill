# Changelog

Each entry names the extension version, which is also the version in the Makefile rules block. See `skills/motion-canvas-scene/references/upgrade.md` for how a project picks up a release.

## 0.3.0

- The extension ships the Canvas Commons player (`canvas-commons-bundle.js`). Projects no longer build it, so the root `package.json`, `vite.player.config.ts`, `motion-canvas-ts.html`, `src/main.ts` and the `include-in-header` script tag are gone. One build remains, the scenes in `animations/`.
- Leaving a slide pauses its player instead of toggling it, so a finished `loop=false` scene no longer restarts. A player that has not loaded no longer throws.
- The Makefile rules sit between `# >>> canvas-commons` and `# <<< canvas-commons` markers, so an upgrade can replace them without touching your own rules.

Upgrading: ask Claude Code to upgrade the project, or run `node <skill>/scripts/upgrade-project.js --root <project>` to see the plan and add `--apply`. Removing the old player build and the script tag needs `--remove-legacy`, which Claude asks you about first. Delete the root `node_modules/` and `package-lock.json` afterwards if you like.

## 0.2.0

- Ported to Canvas Commons 0.4.0 (`@canvas-commons/*`, `<canvas-commons-player>`).
