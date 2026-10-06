# Validate an existing project

Use this when the user asks whether their project works, or when an animation fails to build or render. These checks are read-only apart from the build and render outputs. Run them in order from the project root and stop at the first failure, except that check 5 first records the state of `dist/` and then rebuilds, and you continue after that. Name the fix, then ask before changing anything.

`<skill>` means the directory that contains this skill (the folder with `SKILL.md` and `assets/`). `<deck>` is the deck that check 3 finds, and `<deck-html>` the same name ending in `.html`. The checks drive everything from that deck, never from a guessed name such as `smoke.qmd`.

The `make` targets below are the `cc-` names, which exist in every project whose Makefile includes `canvas-commons.mk`, whatever short names it has. A project from an older template has no `canvas-commons.mk`: use the short names there (`make force-build`), and expect the player config to be a root `vite.config.ts`. That older layout still works.

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

3. The Makefile names a deck that exists, and the deck's output is ignored.

   ```bash
   if grep -q '^include canvas-commons.mk' Makefile; then ls canvas-commons.mk && make -s cc-deck; else grep -E '^QMD_FILE' Makefile; fi
   ```

   That prints `<deck>`. Then, with that name:

   ```bash
   ls <deck>
   grep -nxE '/?<deck-html>' .gitignore
   ls smoke.qmd 2>/dev/null; grep -nE 'smoke\.(qmd|html)' Makefile canvas-commons.mk .gitignore _quarto.yml 2>/dev/null
   ```

   Expected: `canvas-commons.mk` is listed when the Makefile includes it, a deck name is printed, `ls` lists the deck, `.gitignore` has a `<deck-html>` line, and the last line prints nothing, unless the user has deliberately kept a `smoke.qmd` deck. Also list any other `.qmd` that embeds animations (`grep -l 'motion-canvas ' *.qmd`): checks 6 and 8 apply to each of them too.

   Failure: a Makefile that includes `canvas-commons.mk` without the file: copy it from `<skill>/assets/project-template/canvas-commons.mk`. No deck name printed: set `QMD_FILE` (template Makefile) or `CC_QMD_FILE` (a Makefile that appended the include) to the deck. A deck that does not exist: ask the user which deck is meant and set the variable to it. A missing `.gitignore` line: append `<deck-html>`. A stray `smoke.qmd` or `smoke.html`: the variable or `.gitignore` still points at the old smoke deck, so point it at the real deck.

4. Every project file is registered in the vite config.

   ```bash
   for f in animations/src/*.ts; do b=$(basename "$f"); case "$b" in *.d.ts|styles.ts) continue;; esac; grep -qE "[\"']\./src/$b[\"']" animations/vite.config.ts || echo "unregistered: $f"; done
   ```

   Expected: no output. The loop skips `.d.ts` declaration files and `styles.ts`, which are not project files.

   Failure: add each listed file to the `project` array in `animations/vite.config.ts` (`scripts/add-scene.js` does this for a new scene, or edit the `project` array by hand). Left unregistered, it is never built and the shortcode shows a blank player.

5. The build outputs exist, and the build succeeds from scratch.

   ```bash
   ls dist/motion-canvas-ts.js dist/animations/src/*.js
   make cc-force-build && find dist -name "*.js" | sort
   ```

   Record the result of the `ls dist/...` command before running `make cc-force-build`, then continue. If it reports "No such file", `dist/` was missing: report that explicitly, because it alone explains a blank player, and the rebuild is the fix. Expected after the rebuild: the build exits 0, and the list includes `dist/motion-canvas-ts.js` and one `dist/animations/src/<name>.js` per project file.

   Failure: match the error text against the "Common errors and fixes" tables in `SKILL.md`.

6. The deck loads the player and copies the built files.

   ```bash
   grep -nE 'dist/\*/\*|motion-canvas-ts\.js' <deck> _quarto.yml _metadata.yml 2>/dev/null
   ```

   Expected: one line with `dist/*/*` (under `resources:`) and one with `./dist/motion-canvas-ts.js` (under `include-in-header:`), both under `format: revealjs:`, either in the deck or in the project's `_quarto.yml` (or a `_metadata.yml`), but not in both. Repeat for each deck that embeds animations.

   Failure: add the missing entry to the deck's YAML by appending to its existing lists, as shown in "Patching an existing deck's YAML" in `bootstrap.md`. Remove a duplicate from the deck when `_quarto.yml` already has it. Without the header script nothing registers the player element; without `resources:` the scene files are missing from the rendered output.

7. The Quarto extension is the current one.

   ```bash
   diff -r _extensions/andrie/motion-canvas <skill>/assets/project-template/_extensions/andrie/motion-canvas
   ```

   Expected: no output. `<skill>` is the absolute path of the skill folder, for example `~/.claude/skills/motion-canvas-scene`.

   Failure: the project has an older copy. The usual difference is `motion-canvas-player` where the current copy has `canvas-commons-player`, which shows as a silent blank player. Report the differences and offer to replace the folder with the template copy.

8. The deck renders and references each animation.

   ```bash
   quarto render <deck>
   grep -o 'src="[^"]*animations/src/[^"]*"' <deck-html> | sort -u
   ```

   Render any other `.qmd` that embeds animations as well, and run the `grep` on each rendered `.html`. If `_quarto.yml` sets an `output-dir`, the `.html` is there.

   Expected: render exits 0, and every `src` listed maps to a built file: drop the leading `./` and prefix `dist/`, so `./animations/src/smoke.js` must exist as `dist/animations/src/smoke.js` (check with `ls dist/animations/src`).

   Failure: a `src` path that does not match a built file is the "Blank animation player" case in `SKILL.md`: fix the shortcode path to `./animations/src/<name>.js`.
