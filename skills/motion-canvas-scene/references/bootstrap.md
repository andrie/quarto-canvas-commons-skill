# Bootstrap a new presentation project

Use this when the user wants a new Quarto presentation project containing Canvas Commons animations. Follow the steps in order. Each step gives a command and its expected result. If a result differs, stop and use `validate.md`.

`<skill>` below means the directory that contains this skill (the folder with `SKILL.md` and `assets/`). `<target>` is the project directory.

## Before you start

Check the target directory is empty or does not exist yet. Never overwrite an existing project.

```bash
ls -A <target>
```

Expected: no output, or "No such file or directory". If it lists files, stop and ask the user for a different directory.

Check the tools exist: `node --version` (22 or later), `npm --version`, `make --version`, `quarto --version`. Report any that are missing instead of continuing.

## Steps

1. Copy the template.

   ```bash
   mkdir -p <target> && cp -r <skill>/assets/project-template/. <target>/ && cd <target>
   ```

   Expected: `ls -A` shows `Makefile`, `package.json`, `vite.config.ts`, `animations/`, `_extensions/`, `src/` and `smoke.qmd`.

2. Install both dependency trees. They are independent.

   ```bash
   npm install && npm --prefix ./animations install
   ```

   Expected: `node_modules/` exists in `<target>` and in `<target>/animations`. npm warnings about vulnerabilities are expected and can be ignored.

3. Build the animations and the player bundle.

   ```bash
   make anim
   ```

   Expected: the command exits 0 and these files exist: `dist/motion-canvas-ts.js`, `dist/animations/src/smoke.js`.

4. Render the smoke deck.

   ```bash
   quarto render smoke.qmd
   ```

   Expected: `smoke.html` exists, contains `dist/motion-canvas-ts.js` and `canvas-commons-player`, and `src="./animations/src/smoke.js"`. The player resolves that `src` relative to `dist/`, so the file that matters is `dist/animations/src/smoke.js`.

   ```bash
   grep -c "motion-canvas-ts.js" smoke.html; grep -c "canvas-commons-player" smoke.html; grep -o 'src="./animations/src/smoke.js"' smoke.html; ls dist/animations/src/smoke.js
   ```

   Expected: both counts are 1 or more, the `src` attribute is printed, and the file is listed. If `_site/` exists instead (the project has a `_quarto.yml`), look there.

5. Replace the smoke deck with the real one.

   Do these three things, in this order:

   1. Rename `smoke.qmd` to the deck's name and keep the `resources:` and `include-in-header:` lines from the smoke deck's YAML. Hand deck writing and styling to the `quarto-presentation` skill. Keep `smoke.qmd` until the real deck renders.
   2. Edit the first line of `Makefile`, `QMD_FILE = smoke.qmd`, to name the new file. `make quarto`, `make preview` and `make publish` all render `QMD_FILE` and will otherwise keep rendering the smoke deck.
   3. Add the deck's rendered `.html` to `.gitignore` (for `talk.qmd`, add `talk.html`). The template ignores `smoke.html` only.

   If a scene uses custom fonts through `animations/global.css`, the deck also needs a stylesheet link to that CSS in `include-in-header:`, next to the player script line. The `motion-canvas-r-code` skill's `references/fonts-and-highlighting.md` has the exact line, but you do not need that skill for anything else in this step.

6. Optional: link the shared library. The template already ships `animations/src/styles.ts`, a snapshot copy of the library's `styles.ts` (the library file is canonical, so a scene can `import {Posit} from '../styles'` with no symlink). The symlink adds the rest of the library: components, utils and scenes. If the `canvas-commons-library` skill is installed, symlink it into the animations source tree.

   ```bash
   ln -s ~/.claude/skills/canvas-commons-library animations/src/lib
   ```

   Import from it in a scene, for example `import {Database} from '../lib/components/Database';` (a scene in `animations/src/scenes/`). The symlink holds an absolute path, so it dangles on any other machine: the template `.gitignore` lists `animations/src/lib`, so it is not committed, and each machine re-creates it with the command above. The template's `animations/vite.config.ts` already sets `resolve.preserveSymlinks`, which the symlink needs for `make anim` to build. The Makefile watches the library with `find -L`, so editing a library file triggers an incremental `make anim`. If a change to a linked file ever fails to rebuild (an older Makefile, say), run `make force-build`.

## Adding scenes

For each real scene, run `add-scene.js <name>` instead of copying files. From `<target>`:

```bash
node <skill>/scripts/add-scene.js <name>
make anim
```

Expected: `dist/animations/src/<name>.js` exists. Reference it in the deck as `{{< motion-canvas ./animations/src/<name>.js auto fullscreen=true >}}`. See `SKILL.md` for the details and for `remove-scene.js`.
