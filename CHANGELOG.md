# Changelog

This is the changelog for the skills (the plugin version in `.claude-plugin/plugin.json`). The Quarto extension has its own, in the [quarto-canvas-commons](https://github.com/andrie/quarto-canvas-commons) repo. `skills/motion-canvas-scene/assets/extension-source.json` records which extension version and commit the project template was copied from. See `skills/motion-canvas-scene/references/upgrade.md` for how a project picks up a release.

## 0.1.0

First packaged release, as a Claude Code plugin and a git clone with an installer.

- The project template and the Quarto extension now come from the quarto-canvas-commons repo (extension 0.4.0). The extension is `canvas-commons` with the shortcode `{{< canvas-commons >}}`. The old `motion-canvas` name still works as an alias.
- The extension ships the Canvas Commons player, so a project no longer builds it: the root `package.json`, `vite.player.config.ts`, `motion-canvas-ts.html`, `src/main.ts` and the `include-in-header` script tag are gone.
- `upgrade-project.js` and `references/upgrade.md` bring a project set up by an older version up to date, asking before anything is deleted. It recognises every extension and Makefile the template has shipped, and handles the rename from `motion-canvas`.
- The Makefile rules sit between `# >>> canvas-commons` and `# <<< canvas-commons` markers so an upgrade can replace them.
- `seed/tour/` has ten short scenes, one per thing you can ask for. `posit_logo-pmds`, `kayak`, `one23` and the library's `quarto_mc` were removed.
- The shared `styles.ts` gains `UI`, `MONO`, `MUTED`, `PANEL`, `CLEAR` and `BORDER`.
