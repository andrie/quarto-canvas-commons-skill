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
for f in vite.config.* Makefile .gitignore _quarto.yml _extensions animations dist node_modules; do [ -e "$f" ] && echo "present: $f"; done
ls *.qmd 2>/dev/null
grep -l '@canvas-commons/' animations/package.json 2>/dev/null
```

Stop here in two cases:

- `animations/package.json` mentions `@canvas-commons/` (the last command prints it): the project is already set up. Run `validate.md` instead.
- `animations/` or `dist/` is present otherwise: the template needs both names. The build writes into `dist/` and `make clean` deletes it. Ask the user: "Your project already has `animations/` (or `dist/`) for something else. Canvas Commons needs that folder name at the project root. Can you move or rename yours first?" Do not continue until they have.

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

   Expected: `ls -A` shows `Makefile`, `animations/`, `_extensions/`, `.gitignore` and `deck.qmd`.

2. Name the deck. The template deck is `deck.qmd`; rename it and point the `Makefile` and `.gitignore` at the new name. Run the `mv` only when `<deck>` is not `deck.qmd`.

   ```bash
   mv deck.qmd <deck>
   sed -i.bak 's/^QMD_FILE = .*/QMD_FILE = <deck>/' Makefile && rm Makefile.bak
   sed -i.bak 's/^title: .*/title: "<title>"/' <deck> && rm <deck>.bak
   printf '%s\n' '<deck-html>' '<deck-base>_files/' >> .gitignore
   grep '^QMD_FILE' Makefile; grep '^title' <deck>; tail -2 .gitignore; ls *.qmd
   ```

   Expected: `QMD_FILE = <deck>`, the title, `<deck-html>` and `<deck-base>_files/`, and `<deck>` as the only `.qmd`. The template `.gitignore` already lists `.quarto/`, Quarto's cache. `make quarto`, `make preview` and `make publish` all render `QMD_FILE`.

3. Install the dependencies of the scenes. The player bundle ships inside the extension, so there is nothing to install at the project root.

   ```bash
   npm --prefix ./animations install
   ```

   Expected: `node_modules/` exists in `<target>/animations`. npm warnings about vulnerabilities are expected and can be ignored.

4. Build the animations.

   ```bash
   make anim
   ```

   Expected: the command exits 0 and `dist/animations/src/smoke.js` exists.

5. Render the deck, then go to "Check the render".

   ```bash
   quarto render <deck>
   ```

## Adding to an existing project

Work from `<target>`. Each step copies what is absent and reports what is present.

1. Copy the folders that only Canvas Commons uses.

   ```bash
   T=<skill>/assets/project-template
   [ -e animations ] || { cp -r "$T/animations" animations && echo "copied: animations/"; }
   if [ ! -e _extensions/andrie/motion-canvas ]; then
     mkdir -p _extensions/andrie && cp -r "$T/_extensions/andrie/motion-canvas" _extensions/andrie/ && echo "copied: _extensions/andrie/motion-canvas/"
   elif diff -rq "$T/_extensions/andrie/motion-canvas" _extensions/andrie/motion-canvas >/dev/null; then echo "same: _extensions/andrie/motion-canvas/"
   else echo "DIFFERS: _extensions/andrie/motion-canvas/"; fi
   ```

   Expected: only `copied:` and `same:` lines. The copied `animations/` includes the `smoke` scene, the toolchain proof. A root `vite.config.*` or `package.json` is the project's own: leave it alone. Canvas Commons adds nothing at the root except the extension, because the scenes build in `animations/` and the player bundle ships inside the extension.

   For each `DIFFERS:` line, show `diff -r "$T/<path>" <path>` and ask:

   - `_extensions/andrie/motion-canvas/`: "Your project has an older copy of the motion-canvas extension. Shall I replace it with the current one?" A pre-fork copy uses the element `motion-canvas-player`, which the current player bundle never defines, so its animations stay blank. A copy from before the bundled player has no `canvas-commons-bundle.js`, so it needs the old `include-in-header` script and a `build:player` step: replacing it means following "Moving a project to the bundled player" in `validate.md`.

2. Wire up the Makefile.

   No `Makefile`: copy the template's and name the deck.

   ```bash
   cp "$T/Makefile" Makefile
   sed -i.bak 's/^QMD_FILE = .*/QMD_FILE = <deck>/' Makefile && rm Makefile.bak
   ```

   A `Makefile` already there: do not replace it. Find which of the template's target and variable names it already defines:

   ```bash
   db=$(make -pRrq -f Makefile 2>/dev/null)
   for t in all install anim force-build serve quarto preview publish clean; do echo "$db" | grep -qE "^$t:" && echo "collision: $t"; done
   for v in QMD_FILE PORT; do echo "$db" | grep -qE "^$v " && echo "collision: $v"; done
   ```

   No collisions: ask "Shall I append the Canvas Commons rules from the template `Makefile` to yours?" On yes, append the template's `Makefile` from the `# Source files` line onwards, preceded by `QMD_FILE = <deck>` and `PORT = 4200`. The user's default goal stays theirs, because it is the first target in the file. Check `make -n anim` prints the build commands.

   Collisions: do not append. Show the collisions and say the template's `Makefile` holds the rules, each commented. Ask whether the user wants to rename the clashing targets in the appended copy (for example `anim` to `cc-anim`) or merge by hand.

   Expected: the user's own targets behave as before, and `make anim` builds. One limitation to tell the user: their own `make clean` is untouched if it collided, and does not remove `dist/`.

3. Update `.gitignore`. Append each missing line, never replace the file (create it if absent):

   ```bash
   for l in node_modules/ dist/ .quarto/ animations/src/lib '<deck-html>' '<deck-base>_files/'; do
     b=${l%/}; b=${b//./\\.}
     case $l in *_files/) b="($b|\*_files)";; esac
     grep -qxE "/?$b/?" .gitignore 2>/dev/null || { echo "$l" >> .gitignore; echo "added: $l"; }
   done
   ```

   Expected: one `added:` line for each entry that was missing. An entry written with or without a leading or trailing `/` counts as present, and an existing `*_files/` line covers `<deck-base>_files/`.

4. Prepare the deck.

   A new deck: copy the template deck under its name, then set its title.

   ```bash
   cp "$T/deck.qmd" <deck>
   sed -i.bak 's/^title: .*/title: "<title>"/' <deck> && rm <deck>.bak
   ```

   An existing deck: do not add slides to it. Patch its YAML header only, as described in "Patching an existing deck's YAML" below.

   Either way, first look for the `resources` entry in project-level YAML:

   ```bash
   grep -nE 'dist/\*[*/]*' _quarto.yml _metadata.yml <deck> 2>/dev/null
   ```

   An entry found in `_quarto.yml` (or a `_metadata.yml` next to the deck) applies to every deck in the project already, so do not add it to the deck too: for a new deck, delete that line from the copied deck's YAML.

5. Install, build and render.

   ```bash
   npm --prefix ./animations install
   make anim
   quarto render <deck>
   ```

   Expected: `animations/node_modules/` exists, `make anim` exits 0 and writes `dist/animations/src/smoke.js`, and the render exits 0. Then go to "Check the render". An existing deck has no animation slide yet, so that check cannot prove the player works: run "Prove the player with a throwaway deck" as well. Never add the smoke slide to the user's deck for this.

6. Tell the user what changed: the folders copied, the Makefile targets appended or the collisions found, the `.gitignore` lines added, and the deck YAML entry added.

### Patching an existing deck's YAML

One entry goes under `format: revealjs:`, a `resources` entry `dist/**`. The player script needs no entry: the extension adds it to any deck that uses the shortcode. Append to a list that already exists; never remove or replace an existing entry. Skip the entry if the `grep` in step 4 found it in `_quarto.yml`.

Key absent:

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
      - dist/**
```

Key present as a list: append.

```yaml
# before
format:
  revealjs:
    resources:
      - data.csv
# after
format:
  revealjs:
    resources:
      - data.csv
      - dist/**
```

A key present as a single value (`resources: data.csv`) becomes a list with the old value first:

```yaml
    resources:
      - data.csv
      - dist/**
```

The `format: revealjs` shorthand string, or `revealjs: default`, must become a mapping:

```yaml
# before
format: revealjs
# after
format:
  revealjs:
    resources:
      - dist/**
```

Other formats alongside: add the entry under `revealjs:` only and leave the other formats alone.

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
      - dist/**
```

If the deck has no `revealjs` format at all, ask the user before changing `format:`.

#### Verify the patch

Copy the deck before you edit it, then compare and render straight after:

```bash
cp <deck> /tmp/cc-deck-before.qmd
# ... edit the YAML header ...
diff /tmp/cc-deck-before.qmd <deck>
quarto render <deck> && grep -c 'dist/\*\*' <deck>
rm /tmp/cc-deck-before.qmd
```

Expected: `diff` prints only `>` (added) lines, apart from the shorthand case, where `< format: revealjs` is replaced by `> format:` and the added lines; every original entry is still there. The render exits 0 and the count is 1 or more (or the entry is in `_quarto.yml`). If `diff` shows any other `<` line, an original entry was lost: restore the copy and patch again.

#### Optional helpers for the two common shapes

These are examples, not a substitute for the check above. Each writes `<deck>.bak` first; delete it once "Verify the patch" passes.

The `format: revealjs` shorthand string:

```bash
perl -0777 -pi.bak -e 's{^format:[ \t]*revealjs[ \t]*\n}{format:\n  revealjs:\n    resources:\n      - dist/**\n}m' <deck>
```

A `revealjs:` mapping that has no `resources` yet. The guard refuses when the key exists anywhere in the deck, because that list must be appended to by hand. The new key takes the indentation of the first key under `revealjs:`:

```bash
grep -qE '^[[:space:]]+resources:' <deck> && echo "key already present: append by hand" || perl -0777 -pi.bak -e 's{^([ \t]*)revealjs:[ \t]*\n([ \t]+)}{$1revealjs:\n$2resources:\n$2  - dist/**\n$2}m' <deck>
```

## Check the render

```bash
grep -c "canvas-commons-player" <deck-html>; grep -o 'src="./animations/src/smoke.js"' <deck-html>; grep -rl "canvas-commons-bundle.js" <deck-base>_files | head -1; ls dist/animations/src/smoke.js
```

Expected for a deck from the template (it has the smoke slide): the count is 1 or more, the `src` attribute is printed, the bundle is listed under the support folder (Quarto copies it there from the extension), and the file is listed. If the project's `_quarto.yml` sets an `output-dir`, or `_site/` exists, look for the rendered `.html` there. The player resolves a relative `src` against the document's `dist/` folder, so `./animations/src/smoke.js` fetches `dist/animations/src/smoke.js`.

Expected for a deck that embeds no animation yet (an existing deck you only patched): the count is 0 and the bundle is not in the output, because the extension adds the player only to a deck that uses the shortcode. Do not report that as a pass: run "Prove the player with a throwaway deck".

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

Expected: the render exits 0, the count is 1 or more, the `src` attribute and the built file are printed, and the last command prints nothing. The leading `_` keeps a whole-project `quarto render` from picking the file up if the cleanup is interrupted. If `_quarto.yml` sets an `output-dir`, the `.html` and `_files/` folder are there: check and delete them there. Quarto may create `.quarto/`, its cache, in a project: leave it, `.gitignore` covers it. If the deck's header carries the `resources` entry only through `_quarto.yml`, the copy inherits it the same way, which is the point.

## After the first real scene

The `smoke` scene and the smoke slide are only a toolchain proof. Once the first real scene builds and renders, delete the smoke slide from the deck and remove the scene:

```bash
node <skill>/scripts/remove-scene.js smoke
make anim
```

`remove-scene.js` deletes `animations/src/smoke.ts`, `animations/src/scenes/smoke.tsx`, the `smoke.meta` files next to each, the `./src/smoke.ts` entry in `animations/vite.config.ts`, and `dist/animations/src/smoke.js` (plus any other `smoke.*` file there). It prints each file it deleted. `make anim` then rebuilds `dist/animations/` from scratch. Expected: `ls dist/animations/src` no longer lists `smoke.js`.

To see that the real scene looks right, not only that it builds, take screenshots of its slide: "Check the scene visually" in `validate.md`.

Hand deck writing and styling to the `quarto-presentation` skill. If a scene uses custom fonts through `animations/global.css`, the deck also needs a stylesheet link to that CSS in `include-in-header:`. The `motion-canvas-r-code` skill's `references/fonts-and-highlighting.md` has the exact line, but you do not need that skill for anything else here.

## Optional: link the shared library

The template already ships `animations/src/styles.ts`, a snapshot copy of the library's `styles.ts` (the library file is canonical, so a scene can `import {Posit} from '../styles'` with no symlink). The symlink adds the rest of the library: components, utils and scenes. If the `canvas-commons-library` skill is installed, symlink it into the animations source tree.

```bash
ln -s ~/.claude/skills/canvas-commons-library animations/src/lib
```

Import from it in a scene, for example `import {Database} from '../lib/components/Database';` (a scene in `animations/src/scenes/`). The symlink holds an absolute path, so it dangles on any other machine: the `.gitignore` lists `animations/src/lib`, so it is not committed, and each machine re-creates it with the command above. The template's `animations/vite.config.ts` already sets `resolve.preserveSymlinks`, which the symlink needs for the build. The `Makefile` watches the library with `find -L`, so editing a library file triggers an incremental `make anim`. If a change to a linked file ever fails to rebuild (an older Makefile, say), run `make force-build`.

## Adding scenes

For each real scene, run `add-scene.js <name>` instead of copying files. From `<target>`:

```bash
node <skill>/scripts/add-scene.js <name>
make anim
```

Expected: `dist/animations/src/<name>.js` exists. Reference it in the deck as `{{< motion-canvas ./animations/src/<name>.js auto fullscreen=true >}}`. See `SKILL.md` for the details and for `remove-scene.js`.
