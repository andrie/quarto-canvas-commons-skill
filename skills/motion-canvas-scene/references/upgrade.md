# Upgrade a project set up by an older version of this skill

Use this when the user has updated the skill and wants an existing project to catch up, asks to "upgrade", "update" or "refresh" the Canvas Commons setup, or when a project looks like it predates the current layout (no `canvas-commons-bundle.js` in its extension, a root `vite.player.config.ts`, or a deck that loads `dist/motion-canvas-ts.js`). `<skill>` is the folder that holds this skill's `SKILL.md`, and `<target>` is the project root, the folder with the `Makefile`.

The work is done by `scripts/upgrade-project.js`. It recognises older copies of the extension and the Makefile by hash (`scripts/known-copies.json` lists every one the template has shipped), so it can replace an untouched copy without asking and leave an edited one alone.

## 1. Look first

```bash
node <skill>/scripts/upgrade-project.js --root <target>
```

This changes nothing. Each line starts with one of:

- `ok:` nothing to do.
- `upgrade:` a safe step that `--apply` performs.
- `remove:` an old file or script tag that the extension has made redundant. It needs the user's say-so.
- `decide:` something the script will not touch, with the reason. Handle each as described in step 3.
- `note:` leftovers the user may want to delete.

The last line says how many steps are pending. If it says `up to date`, report that and stop.

## 2. Apply the safe steps

Tell the user what the plan says, in plain words, then run:

```bash
node <skill>/scripts/upgrade-project.js --root <target> --apply
```

That replaces an untouched older extension (including the rename from `_extensions/andrie/motion-canvas` to `_extensions/andrie/canvas-commons`, since the two cannot coexist), replaces the Makefile rules block between the `# >>> canvas-commons` and `# <<< canvas-commons` markers (the user's own rules around it stay), rewrites a Makefile that is an unedited older template while keeping its `QMD_FILE` and `PORT`, and deletes stale build output in `dist/`.

If the project is under git, suggest committing first, or review `git diff` afterwards.

## 3. Ask about the rest

Each of these needs an explicit yes. Never run the flag without one.

- `remove:` lines. Ask "Your project builds its own player bundle, which the extension now provides. Shall I remove the old files and the script tag in the deck?" On yes, run the same command with `--remove-legacy` added. It removes only files it recognises as the template's, deletes the one script line in the deck (and the `include-in-header:` key if that leaves it empty) and leaves every other header entry alone.
- `note: ... still uses {{< motion-canvas >}}`. The old shortcode name works but warns on every render. Offer to rename it, and on yes add `--rename-shortcode` (it leaves the escaped `{{{< ... >}}}` examples in a deck alone).
- `decide: the extension ... has been edited`. Show `diff -r` of the two folders, as the line says, and ask whether to replace the user's copy. The usual cause is a fix the user made in the extension's player script (`motion-canvas-player.js`, now `canvas-commons-slides.js`): check whether the template already has it before replacing. On yes, add `--replace-extension`.
- `decide: ... mentions motion-canvas-ts.js in a form this script does not recognise`. Find the `<script>` tag and remove it by hand.
- `decide: the Makefile has Canvas Commons rules without the managed markers`. Follow "Upgrading a Makefile by hand" below.
- `decide: ... no "resources: dist/**" entry`. Patch the deck as in "Patching an existing deck's YAML" in `bootstrap.md`.
- `decide: canvas-commons.mk is not included`. It is a leftover from an older template. Ask before deleting it.

## 4. Check that it works

```bash
node <skill>/scripts/upgrade-project.js --root <target>
npm --prefix ./animations install
make force-build && quarto render <deck>
```

Expected: the script reports `ok:` for everything it handles, the build and render exit 0. The old root `package.json` and `node_modules/` may be left behind (a `note:` says so). Then run "Prove the player with a throwaway deck" in `bootstrap.md`, or screenshot a real slide, because a render that exits 0 does not prove the player loads.

Also check that the scene packages match the player. The bundled player is built with the Canvas Commons version in `<skill>/assets/project-template/animations/package.json`; if the project's `animations/package.json` pins a different version of `@canvas-commons/*`, report it.

## Upgrading a Makefile by hand

For a Makefile the script could not match. The goal is one managed block, with the user's own rules and variables outside it.

1. Copy the block from the template: every line of `<skill>/assets/project-template/Makefile` from `# >>> canvas-commons` to `# <<< canvas-commons`.
2. In the user's Makefile, remove the old Canvas Commons rules: the source and marker variables, and the targets `all install anim force-build serve quarto preview publish clean` if they are the template's. Keep any rule the user wrote or changed, and tell them it now clashes with the block if the name matches.
3. Make sure `QMD_FILE = <deck>` and `PORT = 4200` are set above the block, then paste the block in.
4. Remove the root player build: the rule that runs `npm run build:player` and its marker `dist/.build-complete`.
5. `make -n anim` should print only the `animations/` build commands.

Next time the script finds the markers and handles the block itself.

## Releasing a change that projects must pick up

For whoever changes the template, not for users.

1. Change the version in `_extension.yml`, the Lua, and the Makefile block marker together (a test checks they agree).
2. Run `node scripts/record-known-copies.js` from the repo root. It adds the new extension and Makefile hashes to `known-copies.json`. Entries are only ever added, so every copy that was ever shipped stays recognisable. A test fails until this is done.
3. Add an entry to `CHANGELOG.md`, with an "Upgrading" note when the project-side steps change.
4. If a file the template used to have is now redundant, teach `upgrade-project.js` to recognise and remove it, behind `--remove-legacy`.
