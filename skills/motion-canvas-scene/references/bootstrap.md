# Bootstrap a project, or add Canvas Commons to an existing one

Use this when the user wants a new Quarto presentation project containing Canvas Commons animations, or wants to add Canvas Commons animations to a project that already exists (typically a Quarto deck or Quarto project, possibly with its own `Makefile`, `package.json`, Vite config and `.gitignore`). Either way Canvas Commons lives at the project root, with the same paths as a new project, so every path in the other skills holds. Follow the steps in order. Each step gives a command and its expected result. If a result differs, stop and use `validate.md`.

`<skill>` below means the directory that contains this skill (the folder with `SKILL.md` and `assets/`), and `T` is shorthand for `<skill>/assets/project-template`. `<target>` is the project directory. `<deck>` is the deck's file name, for example `conf-talk.qmd`, `<deck-html>` is the same name ending in `.html` (`conf-talk.html`), and `<deck-base>` is the name without its extension (`conf-talk`), so Quarto's support folder is `<deck-base>_files/`.

## Before you start

Check the tools exist: `node --version` (22 or later), `npm --version`, `make --version`, `quarto --version`. Report any that are missing instead of continuing.

### 1. Classify the target

```bash
ls -A <target>
```

No output, or "No such file or directory", means a **new project**. Anything else means an **existing project**: take the inventory below and follow "Adding to an existing project", never "New project".

```bash
cd <target>
for f in package.json vite.config.* vite.player.config.ts Makefile canvas-commons.mk .gitignore _quarto.yml _extensions animations dist node_modules src/main.ts motion-canvas-ts.html; do [ -e "$f" ] && echo "present: $f"; done
ls *.qmd 2>/dev/null
grep -l '@canvas-commons/' animations/package.json 2>/dev/null
```

Stop here in two cases:

- `animations/package.json` mentions `@canvas-commons/` (the last command prints it): the project is already set up. Run `validate.md` instead.
- `animations/` or `dist/` is present otherwise: the template needs both names. The build writes into `dist/` and `make cc-clean` deletes it. Ask the user: "Your project already has `animations/` (or `dist/`) for something else. Canvas Commons needs that folder name at the project root. Can you move or rename yours first?" Do not continue until they have.

The hard rule for an existing project: **never overwrite or delete a file**. For every template file, absent means copy, present means merge by the rules in "Adding to an existing project", and anything those rules cannot decide means asking the user the question given there.

### 2. Ask for the deck name

Always ask the user; never pick a name yourself, and never use `smoke.qmd`.

- New project: "What should the deck be called? For example `conf-talk.qmd`."
- Existing project with `.qmd` files: list them and ask "Which deck should the animations go in: one of these, or a new deck (give its name)?"
- Existing project with no `.qmd` files: ask as for a new project.

Check the answer before using it:

- It ends in `.qmd`; add the extension if the user left it off.
- It is a plain file name at the project root: no `/`, no `..`. If it has spaces, suggest a hyphenated name (`conf talk.qmd` to `conf-talk.qmd`), because `QMD_FILE` in a Makefile does not survive spaces.
- A new deck must not exist yet (`ls <deck>` reports "No such file"). An existing deck must exist and be a revealjs deck (`grep -n revealjs <deck> _quarto.yml`); if it is not, ask before going on.

Ask for a title too for a new deck, or derive one from the name (`conf-talk.qmd` to "Conf talk").

## New project

1. Copy the template.

   ```bash
   mkdir -p <target> && cp -r <skill>/assets/project-template/. <target>/ && cd <target>
   ```

   Expected: `ls -A` shows `Makefile`, `canvas-commons.mk`, `package.json`, `vite.player.config.ts`, `motion-canvas-ts.html`, `animations/`, `_extensions/`, `src/`, `.gitignore` and `deck.qmd`.

2. Name the deck. The template deck is `deck.qmd`; rename it and point the `Makefile` and `.gitignore` at the new name. Run the `mv` only when `<deck>` is not `deck.qmd`.

   ```bash
   mv deck.qmd <deck>
   sed -i.bak 's/^QMD_FILE = .*/QMD_FILE = <deck>/' Makefile && rm Makefile.bak
   sed -i.bak 's/^title: .*/title: "<title>"/' <deck> && rm <deck>.bak
   printf '%s\n' '<deck-html>' '<deck-base>_files/' >> .gitignore
   grep '^QMD_FILE' Makefile; grep '^title' <deck>; tail -2 .gitignore; ls *.qmd
   ```

   Expected: `QMD_FILE = <deck>`, the title, `<deck-html>` and `<deck-base>_files/`, and `<deck>` as the only `.qmd`. The template `.gitignore` already lists `.quarto/`, Quarto's cache. `make quarto`, `make preview` and `make publish` all render `QMD_FILE`.

3. Install both dependency trees. They are independent.

   ```bash
   npm install && npm --prefix ./animations install
   ```

   Expected: `node_modules/` exists in `<target>` and in `<target>/animations`. npm warnings about vulnerabilities are expected and can be ignored.

4. Build the animations and the player bundle.

   ```bash
   make anim
   ```

   Expected: the command exits 0 and these files exist: `dist/motion-canvas-ts.js`, `dist/animations/src/smoke.js`.

5. Render the deck, then go to "Check the render".

   ```bash
   quarto render <deck>
   ```

## Adding to an existing project

Work from `<target>`. Each step copies what is absent and reports what is present.

1. Copy the files that only Canvas Commons uses.

   ```bash
   T=<skill>/assets/project-template
   for f in canvas-commons.mk vite.player.config.ts motion-canvas-ts.html src/main.ts; do
     if [ ! -e "$f" ]; then mkdir -p "$(dirname "$f")" && cp "$T/$f" "$f" && echo "copied: $f"
     elif cmp -s "$T/$f" "$f"; then echo "same: $f"
     else echo "DIFFERS: $f"; fi
   done
   [ -e animations ] || { cp -r "$T/animations" animations && echo "copied: animations/"; }
   if [ ! -e _extensions/andrie/motion-canvas ]; then
     mkdir -p _extensions/andrie && cp -r "$T/_extensions/andrie/motion-canvas" _extensions/andrie/ && echo "copied: _extensions/andrie/motion-canvas/"
   elif diff -rq "$T/_extensions/andrie/motion-canvas" _extensions/andrie/motion-canvas >/dev/null; then echo "same: _extensions/andrie/motion-canvas/"
   else echo "DIFFERS: _extensions/andrie/motion-canvas/"; fi
   ```

   Expected: only `copied:` and `same:` lines. The copied `animations/` includes the `smoke` scene, the toolchain proof. A root `vite.config.*` is the project's own: leave it alone. The player builds from `vite.player.config.ts` instead.

   For each `DIFFERS:` line, show `diff -r "$T/<path>" <path>` and ask:

   - `_extensions/andrie/motion-canvas/`: "Your project has an older copy of the motion-canvas extension. Shall I replace it with the current one?" A pre-fork copy uses the element `motion-canvas-player`, which the new player bundle never defines, so its animations stay blank.
   - `canvas-commons.mk`: "Your `canvas-commons.mk` differs from the template's. Shall I replace it?"
   - `vite.player.config.ts`, `motion-canvas-ts.html` or `src/main.ts`: "Your project already has `<path>`, and Canvas Commons needs that name for its player bundle. Can you rename yours, or should I use your file as it is?"

2. Merge `package.json`. If it is absent, copy it: `cp "$T/package.json" package.json`. If it is present, preview the merge, then write it:

   ```bash
   node <skill>/scripts/merge-package-json.js "$T/package.json" package.json --dry-run
   node <skill>/scripts/merge-package-json.js "$T/package.json" package.json
   ```

   The script adds the template's missing `dependencies` and the `build:player` script, keeps every value already there, and never touches other fields. A package listed under either `dependencies` or `devDependencies` counts as present. Report every `conflict:` line to the user. A version conflict keeps the user's version: say so, and that the player bundle builds with it. A `scripts.build:player` conflict needs a decision, because the Makefile runs `npm run build:player`: ask "Your `package.json` already has a `build:player` script. Can I rename yours?" The root `"type"` field does not matter: Vite bundles the `.ts` config either way.

3. Wire up the Makefile.

   No `Makefile`: copy the template's and name the deck.

   ```bash
   cp "$T/Makefile" Makefile
   sed -i.bak 's/^QMD_FILE = .*/QMD_FILE = <deck>/' Makefile && rm Makefile.bak
   ```

   A `Makefile` already there: do not replace it. If it already contains `include canvas-commons.mk`, it is wired up: check `make -s cc-deck` prints `<deck>` and move on. Otherwise append the deck variable, the include, and a short alias for each target name the Makefile does not already define:

   ```bash
   {
     printf '\n# Canvas Commons animations (motion-canvas-scene skill)\nCC_QMD_FILE = %s\ninclude canvas-commons.mk\n' '<deck>'
     for t in anim build force-build quarto preview serve; do
       if make -pRrq -f Makefile 2>/dev/null | grep -qE "^$t:"; then echo "collision: $t, use make cc-$t" >&2
       else printf '.PHONY: %s\n%s: cc-%s\n' "$t" "$t" "$t"; fi
     done
   } > /tmp/cc-makefile-append && cat /tmp/cc-makefile-append >> Makefile
   make -s cc-deck
   ```

   Expected: `make -s cc-deck` prints `<deck>`, and the user's default goal is unchanged (`canvas-commons.mk` never takes it). `make -p` reads the Makefile's real rule database, so it also finds targets declared several to a line. Tell the user which `collision:` lines appeared: those short names keep doing what their Makefile did, and the Canvas Commons version is `make cc-<name>` (for example `make cc-anim`, `make cc-quarto`). Every `cc-` target always exists: `cc-install`, `cc-anim`, `cc-build`, `cc-force-build`, `cc-quarto`, `cc-preview`, `cc-publish`, `cc-serve`, `cc-clean`, `cc-deck`. One limitation to tell the user: their own `make clean` is untouched and does not remove `dist/`; `make cc-clean` does.

4. Update `.gitignore`. Append each missing line, never replace the file (create it if absent):

   ```bash
   for l in node_modules/ dist/ .quarto/ animations/src/lib '<deck-html>' '<deck-base>_files/'; do
     b=${l%/}; b=${b//./\\.}
     case $l in *_files/) b="($b|\*_files)";; esac
     grep -qxE "/?$b/?" .gitignore 2>/dev/null || { echo "$l" >> .gitignore; echo "added: $l"; }
   done
   ```

   Expected: one `added:` line for each entry that was missing. An entry written with or without a leading or trailing `/` counts as present, and an existing `*_files/` line covers `<deck-base>_files/`.

5. Prepare the deck.

   A new deck: copy the template deck under its name, then set its title.

   ```bash
   cp "$T/deck.qmd" <deck>
   sed -i.bak 's/^title: .*/title: "<title>"/' <deck> && rm <deck>.bak
   ```

   An existing deck: do not add slides to it. Patch its YAML header only, as described in "Patching an existing deck's YAML" below.

   Either way, first look for the two entries in project-level YAML:

   ```bash
   grep -nE 'dist/\*/\*|motion-canvas-ts\.js' _quarto.yml _metadata.yml <deck> 2>/dev/null
   ```

   An entry found in `_quarto.yml` (or a `_metadata.yml` next to the deck) applies to every deck in the project already, so do not add it to the deck too: for a new deck, delete that line from the copied deck's YAML. Loading the player script twice defines its custom element twice.

6. Install, build and render.

   ```bash
   npm install && npm --prefix ./animations install
   make cc-anim
   quarto render <deck>
   ```

   Expected: both `node_modules/` exist, `make cc-anim` exits 0 and writes `dist/motion-canvas-ts.js` and `dist/animations/src/smoke.js`, and the render exits 0. Then go to "Check the render". An existing deck has no animation slide yet, so that check cannot prove the player works: run "Prove the player with a throwaway deck" as well. Never add the smoke slide to the user's deck for this.

7. Tell the user what changed: the files copied, the `package.json` additions and conflicts, the Makefile collisions and which `cc-` names to use, the `.gitignore` lines added, and the deck YAML entries added.

### Patching an existing deck's YAML

Two entries go under `format: revealjs:`, a `resources` entry `dist/*/*` and an `include-in-header` entry `text: <script src="./dist/motion-canvas-ts.js"></script>`. Append them to any list that already exists; never remove or replace an existing entry. Skip an entry the `grep` in step 5 found in `_quarto.yml`.

Keys absent:

```yaml
# before
format:
  revealjs:
    theme: dark
# after
format:
  revealjs:
    theme: dark
    resources:
      - dist/*/*
    include-in-header:
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

Keys present as lists: append.

```yaml
# before
format:
  revealjs:
    resources:
      - data.csv
    include-in-header:
      - text: <meta name="deck-owner" content="me">
# after
format:
  revealjs:
    resources:
      - data.csv
      - dist/*/*
    include-in-header:
      - text: <meta name="deck-owner" content="me">
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

A key present as a single value (`resources: data.csv` or `include-in-header: header.html`) becomes a list with the old value first:

```yaml
    resources:
      - data.csv
      - dist/*/*
    include-in-header:
      - header.html
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

The `format: revealjs` shorthand string, or `revealjs: default`, must become a mapping:

```yaml
# before
format: revealjs
# after
format:
  revealjs:
    resources:
      - dist/*/*
    include-in-header:
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

Other formats alongside: add the entries under `revealjs:` only and leave the other formats alone.

```yaml
# before
format:
  html: default
  revealjs:
    slide-number: true
# after
format:
  html: default
  revealjs:
    slide-number: true
    resources:
      - dist/*/*
    include-in-header:
      - text: <script src="./dist/motion-canvas-ts.js"></script>
```

If the deck has no `revealjs` format at all, ask the user before changing `format:`.

#### Verify the patch

Copy the deck before you edit it, then compare and render straight after:

```bash
cp <deck> /tmp/cc-deck-before.qmd
# ... edit the YAML header ...
diff /tmp/cc-deck-before.qmd <deck>
quarto render <deck> && grep -c 'dist/motion-canvas-ts.js' <deck-html>
rm /tmp/cc-deck-before.qmd
```

Expected: `diff` prints only `>` (added) lines, apart from the shorthand case, where `< format: revealjs` is replaced by `> format:` and the added lines; every original entry is still there. The render exits 0 and the count is 1 or more. If `diff` shows any other `<` line, an original entry was lost: restore the copy and patch again.

#### Optional helpers for the two common shapes

These are examples, not a substitute for the check above. Each writes `<deck>.bak` first; delete it once "Verify the patch" passes.

The `format: revealjs` shorthand string:

```bash
perl -0777 -pi.bak -e 's{^format:[ \t]*revealjs[ \t]*\n}{format:\n  revealjs:\n    resources:\n      - dist/*/*\n    include-in-header:\n      - text: <script src="./dist/motion-canvas-ts.js"></script>\n}m' <deck>
```

A `revealjs:` mapping that has neither `resources` nor `include-in-header` yet. The guard refuses when either key exists anywhere in the deck, because those lists must be appended to by hand. The new keys take the indentation of the first key under `revealjs:`:

```bash
grep -qE '^[[:space:]]+(resources|include-in-header):' <deck> && echo "keys already present: append by hand" || perl -0777 -pi.bak -e 's{^([ \t]*)revealjs:[ \t]*\n([ \t]+)}{$1revealjs:\n$2resources:\n$2  - dist/*/*\n$2include-in-header:\n$2  - text: <script src="./dist/motion-canvas-ts.js"></script>\n$2}m' <deck>
```

## Check the render

```bash
grep -c "motion-canvas-ts.js" <deck-html>; grep -c "canvas-commons-player" <deck-html>; grep -o 'src="./animations/src/smoke.js"' <deck-html>; ls dist/animations/src/smoke.js
```

Expected for a deck from the template (it has the smoke slide): both counts are 1 or more, the `src` attribute is printed, and the file is listed. If the project's `_quarto.yml` sets an `output-dir`, or `_site/` exists, look for the rendered `.html` there. The player resolves the `src` relative to `dist/`, so the file that matters is `dist/animations/src/smoke.js`.

Expected for a deck that embeds no animation yet (an existing deck you only patched): the `motion-canvas-ts.js` count is 1 or more, but the `canvas-commons-player` count is 0 and no `src` prints. That proves only that the script tag is in place, not that the player works, so do not report it as a pass: run "Prove the player with a throwaway deck".

## Prove the player with a throwaway deck

This proves the player and the smoke scene in the deck's real format settings without touching the deck. It writes a temporary `_cc-smoke.qmd` with the deck's YAML header and one smoke slide, renders it, checks it, and deletes everything it made. If `_cc-smoke.qmd` already exists, stop and ask instead.

```bash
awk '{l=$0; sub(/\r$/,"",l)} NR==1 && l!="---"{exit} {print} NR>1 && l=="---"{exit}' <deck> > _cc-smoke.qmd
printf '\n## Smoke test {.hidetitle}\n\n{{< motion-canvas ./animations/src/smoke.js auto fullscreen=true >}}\n' >> _cc-smoke.qmd
quarto render _cc-smoke.qmd
grep -c "canvas-commons-player" _cc-smoke.html; grep -o 'src="./animations/src/smoke.js"' _cc-smoke.html; ls dist/animations/src/smoke.js
rm -rf _cc-smoke.qmd _cc-smoke.html _cc-smoke_files
ls -d _cc-smoke* 2>/dev/null
```

Expected: the render exits 0, the count is 1 or more, the `src` attribute and the built file are printed, and the last command prints nothing. The leading `_` keeps a whole-project `quarto render` from picking the file up if the cleanup is interrupted. If `_quarto.yml` sets an `output-dir`, the `.html` and `_files/` folder are there: check and delete them there. Quarto may create `.quarto/`, its cache, in a project: leave it, `.gitignore` covers it. If the deck's header carries the two entries only through `_quarto.yml`, the copy inherits them the same way, which is the point.

## After the first real scene

The `smoke` scene and the smoke slide are only a toolchain proof. Once the first real scene builds and renders, delete the smoke slide from the deck and remove the scene:

```bash
node <skill>/scripts/remove-scene.js smoke
```

Hand deck writing and styling to the `quarto-presentation` skill. If a scene uses custom fonts through `animations/global.css`, the deck also needs a stylesheet link to that CSS in `include-in-header:`, next to the player script line. The `motion-canvas-r-code` skill's `references/fonts-and-highlighting.md` has the exact line, but you do not need that skill for anything else here.

## Optional: link the shared library

The template already ships `animations/src/styles.ts`, a snapshot copy of the library's `styles.ts` (the library file is canonical, so a scene can `import {Posit} from '../styles'` with no symlink). The symlink adds the rest of the library: components, utils and scenes. If the `canvas-commons-library` skill is installed, symlink it into the animations source tree.

```bash
ln -s ~/.claude/skills/canvas-commons-library animations/src/lib
```

Import from it in a scene, for example `import {Database} from '../lib/components/Database';` (a scene in `animations/src/scenes/`). The symlink holds an absolute path, so it dangles on any other machine: the `.gitignore` lists `animations/src/lib`, so it is not committed, and each machine re-creates it with the command above. The template's `animations/vite.config.ts` already sets `resolve.preserveSymlinks`, which the symlink needs for the build. `canvas-commons.mk` watches the library with `find -L`, so editing a library file triggers an incremental `make anim` (or `make cc-anim`). If a change to a linked file ever fails to rebuild (an older Makefile, say), run `make force-build` (or `make cc-force-build`).

## Adding scenes

For each real scene, run `add-scene.js <name>` instead of copying files. From `<target>`:

```bash
node <skill>/scripts/add-scene.js <name>
make anim
```

Use `make cc-anim` where the project's own Makefile already had an `anim` target. Expected: `dist/animations/src/<name>.js` exists. Reference it in the deck as `{{< motion-canvas ./animations/src/<name>.js auto fullscreen=true >}}`. See `SKILL.md` for the details and for `remove-scene.js`.
