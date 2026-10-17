# Validate an existing project

Use this when the user asks whether their project works, or when an animation fails to build or render. These checks are read-only apart from the build and render outputs. Run them in order from the project root and stop at the first failure, except that check 5 first records the state of `dist/` and then rebuilds, and you continue after that. Name the fix, then ask before changing anything.

`<skill>` means the directory that contains this skill (the folder with `SKILL.md` and `assets/`). `<deck>` is the deck that check 3 finds, `<deck-html>` the same name ending in `.html`, and `<deck-base>` the name without its extension. The checks drive everything from that deck, never from a guessed name such as `smoke.qmd`.

A project from an older template may build the player itself (a root `package.json`, `vite.player.config.ts` or `vite.config.ts`, `motion-canvas-ts.html` and `src/main.ts`) and may lack some of the `make` targets below. That layout still works until the extension is replaced: then follow "Moving a project to the bundled player" at the end of this file.

## Checks

1. The animations package file exists, and nothing refers to the old scope.

   ```bash
   ls animations/package.json
   grep -rn "@motion-canvas/" animations/package.json animations/src # PORT-NOTE: deliberate old scope
   grep -rln "lezer-r" animations/src
   grep -n "lezer-r" animations/package.json
   ```

   Expected: the file listed; the first `grep` prints nothing; if the second `grep` lists any file, the third prints a `lezer-r` line. A `grep` that prints nothing exits 1, which is the expected clean result here, not a failure.

   Failure: a missing `animations/package.json` means this is not a project (use `bootstrap.md`). Any `@motion-canvas/` hit is a stale scope: replace it with `@canvas-commons/` (the `lib/...` import and `offset` rules in `references/errors.md` also apply). A missing `lezer-r` line: `npm --prefix ./animations install lezer-r`. <!-- PORT-NOTE: deliberate old scope -->

2. The dependencies are installed.

   ```bash
   ls -d animations/node_modules
   ```

   Expected: the directory listed.

   Failure: `npm --prefix ./animations install`.

3. The Makefile names a deck that exists, and the deck's output is ignored.

   ```bash
   grep -E '^QMD_FILE' Makefile
   ```

   That prints `<deck>`. Then, with that name:

   ```bash
   ls <deck>
   grep -nxE '/?<deck-html>' .gitignore; grep -nxE '/?(<deck-base>|\*)_files/?' .gitignore
   ls smoke.qmd 2>/dev/null; grep -nE 'smoke\.(qmd|html)' Makefile .gitignore _quarto.yml 2>/dev/null
   ```

   Expected: a deck name is printed, `ls` lists the deck, `.gitignore` has a `<deck-html>` line and a `<deck-base>_files/` (or `*_files/`) line, and the last line prints nothing, unless the user has deliberately kept a `smoke.qmd` deck. Also list any other `.qmd` that embeds animations (`grep -l 'motion-canvas ' *.qmd`): checks 6 and 8 apply to each of them too.

   Failure: no deck name printed: set `QMD_FILE` to the deck. A deck that does not exist: ask the user which deck is meant and set the variable to it. A missing `.gitignore` line: append `<deck-html>` or `<deck-base>_files/`. A stray `smoke.qmd` or `smoke.html`: the variable or `.gitignore` still points at the old smoke deck, so point it at the real deck.

4. Every project file is registered in the vite config, and the config empties its output directory.

   ```bash
   for f in animations/src/*.ts; do b=$(basename "$f"); case "$b" in *.d.ts|styles.ts) continue;; esac; grep -qE "[\"']\./src/$b[\"']" animations/vite.config.ts || echo "unregistered: $f"; done
   ```

   Expected: no output. The loop skips `.d.ts` declaration files and `styles.ts`, which are not project files.

   Failure: add each listed file to the `project` array in `animations/vite.config.ts` (`scripts/add-scene.js` does this for a new scene, or edit the `project` array by hand). Left unregistered, it is never built and the shortcode shows a blank player.

   Then check that the build empties its output directory:

   ```bash
   grep -nE '(outDir|emptyOutDir):' animations/vite.config.ts
   ```

   Expected: `outDir: "../dist/animations"` and `emptyOutDir: true`.

   Failure: a config from an older template prints nothing. It sets the output only through `rollupOptions.output.dir`, so Vite will not empty a directory outside `animations/` (the build prints "outDir ... is not inside project root and will not be emptied"), and the bundle of every removed scene stays in `dist/animations/src/`. To patch it, add `outDir: "../dist/animations",` and `emptyOutDir: true,` as the first lines under `build: {`, delete the `dir: "../dist/animations",` line from `rollupOptions.output`, then `make force-build`. Only set `emptyOutDir: true` when `outDir` is `../dist/animations`: pointed at `../dist` or `..` it would delete everything else in `dist/` or the project.

5. The build outputs exist, and the build succeeds from scratch.

   ```bash
   ls dist/animations/src/*.js
   make force-build && find dist -name "*.js" | sort
   ```

   Record the result of the `ls dist/...` command before running `make force-build`, then continue. If it reports "No such file", `dist/` was missing: report that explicitly, because it alone explains a blank player, and the rebuild is the fix. Expected after the rebuild: the build exits 0, and the list includes one `dist/animations/src/<name>.js` per project file.

   Failure: match the error text against the tables in `references/errors.md`.

6. The deck copies the built files.

   ```bash
   grep -nE 'dist/\*[*/]*|motion-canvas-ts\.js' <deck> _quarto.yml _metadata.yml 2>/dev/null
   ```

   Expected: one line with `dist/**` (under `resources:`) under `format: revealjs:`, either in the deck or in the project's `_quarto.yml` (or a `_metadata.yml`), but not in both. Repeat for each deck that embeds animations. The glob must be exactly `dist/**`: an older `dist/*/*` matches only files two levels deep, so it copies `dist/animations/*` but skips `dist/animations/src/`, where the built scenes are. No `motion-canvas-ts.js` line should appear: the extension loads the player now.

   Failure: replace a `dist/*/*` entry with `dist/**`, and add a missing entry to the deck's YAML by appending to its existing list, as shown in "Patching an existing deck's YAML" in `bootstrap.md`. Remove a duplicate from the deck when `_quarto.yml` already has it. A `motion-canvas-ts.js` line means the project predates the bundled player: follow "Moving a project to the bundled player" below. To confirm the scenes are copied, render to a temporary folder and list it: `quarto render <deck> --output-dir /tmp/cc-out && ls /tmp/cc-out/dist/animations/src`, which must list each scene `.js`. Without `resources:` the scene files are missing from the rendered output.

7. The Quarto extension is the current one.

   ```bash
   node <skill>/scripts/upgrade-project.js --root .
   ```

   Expected: `up to date` as the last line, and `ok: extension is current`. `<skill>` is the absolute path of the skill folder, for example `~/.claude/skills/motion-canvas-scene`. The script tells an untouched older copy from an edited one.

   Failure: the project has an older copy. The usual difference is `motion-canvas-player` where the current copy has `canvas-commons-player`, which shows as a silent blank player. Report the differences and offer to replace the folder with the template copy.

8. The deck renders and references each animation.

   ```bash
   quarto render <deck>
   grep -o 'src="[^"]*animations/src/[^"]*"' <deck-html> | sort -u
   ```

   Render any other `.qmd` that embeds animations as well, and run the `grep` on each rendered `.html`. If `_quarto.yml` sets an `output-dir`, the `.html` is there.

   Expected: render exits 0, and every `src` listed maps to a built file: drop the leading `./` and prefix `dist/`, so `./animations/src/smoke.js` must exist as `dist/animations/src/smoke.js` (check with `ls dist/animations/src`).

   If the `grep` prints nothing, the deck embeds no animation yet, so this check has proved nothing about the player: do not report it as passing. Run "Prove the player with a throwaway deck" in `bootstrap.md`, which renders a temporary copy of the deck's header with the smoke slide and deletes it afterwards, without touching the deck. Expected there: a `canvas-commons-player` count of 1 or more and the smoke `src`.

   An animation that imports an image (`import logo from '../assets/logo.svg'`) needs `base: "./"` in `animations/vite.config.ts`. Without it the bundle asks for `/logo.svg` from the site root, which 404s in the deck, so the player stays black although `make serve` works and the build reports no error. Check `grep -c 'base:' animations/vite.config.ts`, and look for the image under `dist/animations/`. The template's smoke scene imports `src/assets/smoke.svg` for this reason: a screenshot of its slide (see below) shows a yellow circle above the square, and prints `page error: Failed to load an image` when `base` is wrong.

   Failure: a `src` path that does not match a built file is the "Blank animation player" case in `references/errors.md`: fix the shortcode path to `./animations/src/<name>.js`.

## Check the scene visually (optional)

The checks above prove that the scenes build and the deck renders, not that a scene looks right. This step is not a pass/fail check: it takes screenshots for you to look at. Run it after `quarto render <deck>`, from the directory that holds `<deck-html>`:

```bash
node <skill>/scripts/screenshot-slide.mjs <deck-html> --slide <n> --at 0.5,2,4 --out /tmp/cc-shots
```

`--slide` is 1-based and counts every horizontal slide, including Quarto's title slide when the YAML has a `title:`. A deck with a title slide and the animation on the next slide is `--slide 2`, which the script opens as `#/1` (reveal.js numbers slides from 0). If the slide has no player, the script warns and lists the slides that have one. `--at` gives seconds after the player starts playing; `--width` and `--height` set the viewport (default 1920 by 1080, the template deck's size). It serves the deck's directory over a local HTTP server (the player fetches the scene bundle, which `file://` blocks), waits for the slide's `canvas-commons-player` to reach its `ready` state and start playing, then writes `<deck-base>-slide<n>-t<seconds>.png` into `--out` (default `canvas-commons-screenshots` in the system temp directory) and prints each path with the scene frame it caught. The frame is the reliable timing: scenes loop, so a late offset can show an early frame.

View the PNGs (the Read tool shows images). Keep `--out` outside the project, or Quarto may publish the screenshots with the deck.

It needs Playwright and its Chromium, which it never adds to the project. It looks in `--playwright <dir>`, then `$PLAYWRIGHT_DIR`, then `~/.cache/canvas-commons-tools`, each a directory whose `node_modules` has `playwright`. When none has it, the script prints the one-off install command and exits 2:

```bash
mkdir -p ~/.cache/canvas-commons-tools && cd ~/.cache/canvas-commons-tools && npm init -y && npm i playwright && npx playwright install chromium
```

On Linux without `libasound.so.2` (common in WSL and containers), Chromium fails to start: the script exits 3 and prints a no-sudo workaround that unpacks the library from `apt-get download libasound2t64` (or `libasound2`) into `~/.cache/canvas-commons-tools/libasound`, which the script then finds by itself. An `LD_LIBRARY_PATH` you set yourself is passed through to the browser. Exit 4 means the deck loaded but a slide or player problem stopped it: the message says which.

Do not use a browser's own headless screenshot with `--virtual-time-budget` instead. The player advances on the real clock, so virtual time races through page loading while the scene has barely started: a 5-second budget still captures one of the first frames.

## Moving a project to the bundled player

Projects bootstrapped before the extension shipped its own player built it themselves: a root `package.json` with a `build:player` script, `vite.player.config.ts`, `motion-canvas-ts.html`, `src/main.ts`, and an `include-in-header` entry `text: <script src="./dist/motion-canvas-ts.js"></script>` in the deck or `_quarto.yml`. Once the extension is replaced with the current copy, which carries `canvas-commons-bundle.js`, those are redundant, and the old script tag must go: the page would load two players and the second `customElements.define` throws.

Never delete the user's files unasked. Show the list and ask "Your project builds its own player bundle, which the extension now provides. Shall I remove these?":

1. Delete the `include-in-header` entry that loads `dist/motion-canvas-ts.js` from the deck or `_quarto.yml`. Keep any other `include-in-header` entries.
2. Delete `vite.player.config.ts`, `motion-canvas-ts.html` and `src/main.ts` (and `src/` if that leaves it empty), but only when `grep -l motion-canvas-ts` shows nothing else uses them.
3. Remove the `build:player` script from the root `package.json`, and the `@canvas-commons/*` and `vite` dependencies it added if nothing else at the root imports them. Leave the file in place if it holds anything else.
4. In the `Makefile`, remove the root build rule (the one that runs `npm run build:player`) and its marker, `dist/.build-complete`, so `anim` depends on the animations marker only. Replacing the `Makefile` with the template's is fine only if the user has not edited it.
5. Run `make force-build && quarto render <deck>`, then "Prove the player with a throwaway deck" in `bootstrap.md`.
