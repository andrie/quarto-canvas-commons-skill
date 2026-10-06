# Validate an existing project

Use this when the user asks whether their project works, or when an animation fails to build or render. These checks are read-only apart from the build and render outputs. Run them in order from the project root and stop at the first failure, except that check 4 first records the state of `dist/` and then rebuilds, and you continue after that. Name the fix, then ask before changing anything.

`<skill>` means the directory that contains this skill (the folder with `SKILL.md` and `assets/`).

## Checks

1. Both package files exist, and nothing refers to the old scope.

   ```bash
   ls package.json animations/package.json
   grep -rn "@motion-canvas/" package.json animations/package.json animations/src # PORT-NOTE: deliberate old scope
   grep -rln "lezer-r" animations/src
   grep -n "lezer-r" animations/package.json
   ```

   Expected: both files listed; the first `grep` prints nothing; if the second `grep` lists any file, the third prints a `lezer-r` line. A `grep` that prints nothing exits 1, which is the expected clean result here, not a failure.

   Failure: a missing `package.json` means this is not a project (use `bootstrap.md`). Any `@motion-canvas/` hit is a stale scope: replace it with `@canvas-commons/` (the `lib/...` import and `offset` rules in the `SKILL.md` error tables also apply). A missing `lezer-r` line: `npm --prefix ./animations install lezer-r`. <!-- PORT-NOTE: deliberate old scope -->

2. Both dependency trees are installed.

   ```bash
   ls -d node_modules animations/node_modules
   ```

   Expected: both directories listed.

   Failure: `npm install && npm --prefix ./animations install`.

3. Every project file is registered in the vite config.

   ```bash
   for f in animations/src/*.ts; do b=$(basename "$f"); case "$b" in *.d.ts|styles.ts) continue;; esac; grep -qE "[\"']\./src/$b[\"']" animations/vite.config.ts || echo "unregistered: $f"; done
   ```

   Expected: no output. The loop skips `.d.ts` declaration files and `styles.ts`, which are not project files.

   Failure: add each listed file to the `project` array in `animations/vite.config.ts` (`scripts/add-scene.js` does this for a new scene, or edit the `project` array by hand). Left unregistered, it is never built and the shortcode shows a blank player.

4. The build outputs exist, and the build succeeds from scratch.

   ```bash
   ls dist/motion-canvas-ts.js dist/animations/src/*.js
   make force-build && find dist -name "*.js" | sort
   ```

   Record the result of the `ls dist/...` command before running `make force-build`, then continue. If it reports "No such file", `dist/` was missing: report that explicitly, because it alone explains a blank player, and the rebuild is the fix. Expected after the rebuild: the build exits 0, and the list includes `dist/motion-canvas-ts.js` and one `dist/animations/src/<name>.js` per project file.

   Failure: match the error text against the "Common errors and fixes" tables in `SKILL.md`.

5. The deck loads the player and copies the built files.

   ```bash
   grep -n -A8 "revealjs:" *.qmd | grep -E "dist/\*/\*|motion-canvas-ts.js"
   ```

   Expected: one line with `dist/*/*` (under `resources:`) and one with `./dist/motion-canvas-ts.js` (under `include-in-header:`), for each deck you render.

   Failure: add them to the deck's YAML as shown in `project-architecture.md`. Without the header script nothing registers the player element; without `resources:` the scene files are missing from the rendered output.

6. The Quarto extension is the current one.

   ```bash
   diff -r _extensions/andrie/motion-canvas <skill>/assets/project-template/_extensions/andrie/motion-canvas
   ```

   Expected: no output. `<skill>` is the absolute path of the skill folder, for example `~/.claude/skills/motion-canvas-scene`.

   Failure: the project has an older copy. The usual difference is `motion-canvas-player` where the current copy has `canvas-commons-player`, which shows as a silent blank player. Report the differences and offer to replace the folder with the template copy.

7. The deck renders and references each animation.

   ```bash
   grep '^QMD_FILE' Makefile
   quarto render <the file named by QMD_FILE>
   grep -o 'src="[^"]*animations/src/[^"]*"' <the rendered .html> | sort -u
   ```

   The deck is the one named by `QMD_FILE` in the `Makefile` (`grep '^QMD_FILE' Makefile` prints it), not a name to guess. Render any other `.qmd` that embeds animations as well, and run the `grep` on each rendered `.html`.

   Expected: render exits 0, and every `src` listed maps to a built file: drop the leading `./` and prefix `dist/`, so `./animations/src/smoke.js` must exist as `dist/animations/src/smoke.js` (check with `ls dist/animations/src`).

   Failure: a `src` path that does not match a built file is the "Blank animation player" case in `SKILL.md`: fix the shortcode path to `./animations/src/<name>.js`.
