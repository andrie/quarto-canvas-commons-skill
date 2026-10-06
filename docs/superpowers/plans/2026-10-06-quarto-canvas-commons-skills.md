# Quarto Canvas Commons skills: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote four Motion Canvas skills to global, port them to Canvas Commons, and add the shared library, offline API generators, scene scripts, an R-code skill and two `quarto-presentation` additions described in the spec.

**Architecture:** Build everything inside this repo under `skills/` (mirroring the spec's layout), prove it works there with real builds, then symlink each skill into `~/.claude/skills/`. The only edits outside the repo are the `quarto-presentation` additions, shown as a diff before applying. Mechanical porting is guarded by a grep check script; the scene scripts are built test-first with `node:test`.

**Tech stack:** Node 20+ (`node:test`, ES modules, no dependencies for the scene scripts), Vite 4 + `@canvas-commons/*` 0.4.0 for build checks, Markdown skills.

**Spec:** `docs/superpowers/specs/2026-10-06-quarto-canvas-commons-skill-design.md`

## Global constraints

- UK English, no em-dashes, sentence-case headings, bold only mid-line, no hard-wrapping in new prose (from `~/.claude/WRITING.md`). Code, identifiers and filenames keep their real spelling. Ported content that is already hard-wrapped stays as it is.
- Package scope `@motion-canvas/*` becomes `@canvas-commons/*`. API usage patterns (signals, tweening, `Layout`, `Polygon.vertex()`, `Code`, cardinal points) are not changed.
- Canonical `Colors.TEXT = '#ACB3BF'`.
- `RHighlighter.ts` and `lezer-r.d.ts` live only in `motion-canvas-r-code`, never in the shared library.
- `lezer-r` is a dependency of `animations/package.json`, not the root project.
- PMDS is the source for `hexagons`, `pipeline`, `styles.ts`; the WSL `conf-2025-working-with-infosec` copy is the canonical Quarto extension.
- `$SCRATCH` means the session scratchpad directory (`/tmp/claude-1000/-home-andrie-github-quarto-canvas-commons-skill/a17b0b99-8e79-4a04-aa62-1575fb9673f8/scratchpad`); throwaway builds go there, the durable smoke project is `~/github/canvas-commons-smoke`.
- No MCP server, no published npm package, no new storyboarding skill, no scaffold script.
- Skill `description` fields state triggers only ("Use when..."), never the workflow (writing-skills SDO rule).
- Reference-skill testing: before finalising each promoted skill, run one retrieval scenario with a fresh subagent (a realistic task, e.g. "add a pulsing hexagon scene") and confirm the skill gets found and applied.

## Findings that change the spec (verified 2026-10-06)

| Finding | Effect |
|---|---|
| `@canvas-commons/ui` does **not** exist on npm (404). The editor package is `@canvas-commons/editor`. | Task 2 decides the replacement; `ui` is only a dev dependency of `animations/`. |
| Packages exist at **0.4.0** (`core`, `2d`, `vite-plugin`, `ffmpeg`, `player`, `editor`, `create`). | Version ranges change from `^3.17.x` to `^0.4.0`. Also `ffmpeg` was `^1.1.0`, now `^0.4.0` and GPLv3. |
| The skill must bootstrap and validate projects early (user request), but the spec's checklist copies files from the infosec project, which exists on one machine only. | Task 4 vendors a template into `assets/project-template/` (a deviation from the spec, flagged in the final report). Still a checklist, no scaffold script. |
| Seed files import subpaths such as `@motion-canvas/2d/lib/components` and `.../lib/code/CodeHighlighter`. | A scope rename may not be enough. Task 2 checks whether these subpaths still exist. |
| The MCP scripts import from the MCP project's compiled `../dist/` (TypeScript output). | Task 9 must port the TS sources, not just wrap the `.js` entry scripts. Scripts live at `~/github/mcp-node-motion-canvas/mcp-node-motion-canvas/scripts/` (nested directory). |
| The repo has no commits yet; `docs/` and `seed/` are untracked. | Task 1 makes the first commit. |

## File structure

```
skills/
  motion-canvas-api/{SKILL.md, references/{api-reference.md,component-hierarchy.md,api-search-index.json}, scripts/{generate-api-search.js,generate-component-hierarchy.js}}
  motion-canvas-scene/{SKILL.md, references/{project-architecture.md,bootstrap.md,validate.md}, assets/project-template/, scripts/{vite-project-array.js,add-scene.js,remove-scene.js}}
  motion-canvas-authoring/SKILL.md
  svg-to-motion-canvas/{SKILL.md, references/worked-examples.md}
  motion-canvas-r-code/{SKILL.md, components/RHighlighter.ts, assets/{lezer-r.d.ts,global.css,shiny-ellmer-code.R}, references/fonts-and-highlighting.md}
  canvas-commons-library/{styles.ts, components/Database.tsx, scenes/{hexagons,pipeline,posit_footer,quarto_mc}.tsx, utils/pulse.ts}
tests/
  scene-scripts.test.js          # node:test for vite-project-array.js, add-scene.js, remove-scene.js
scripts/
  check-ported.sh                # fails if @motion-canvas/ or #447099 TEXT remain
  install.sh                     # symlinks skills/* into ~/.claude/skills/
seed/                            # already present; stays as worked examples
```

`seed/lib/*` and `seed/r-code/*` are moved (git mv) into the final locations, per the spec, not re-copied from the conference projects.

---

### Task 1: Repo baseline and check script

**Files:**
- Create: `scripts/check-ported.sh`, `skills/.gitkeep`
- Commit: existing `docs/`, `seed/`

- [ ] **Step 1: Initial commit of the existing material**

```bash
cd ~/github/quarto-canvas-commons-skill
git add docs seed
git commit -m "docs: add design spec and seed material"
```

- [ ] **Step 2: Write the check script**

```bash
#!/usr/bin/env bash
# Fails if any ported skill still mentions the old scope, or the drifted TEXT colour.
set -u
cd "$(dirname "$0")/.."
status=0
if grep -rn "@motion-canvas/" skills --include='*.md' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' | grep -v 'PORT-NOTE'; then
  echo "FAIL: old @motion-canvas/ scope found (mark deliberate mentions with PORT-NOTE)"; status=1
fi
if grep -rnE "TEXT[^A-Za-z]*['\"]?#447099" skills; then
  echo "FAIL: Colors.TEXT drifted to #447099"; status=1
fi
[ $status -eq 0 ] && echo "OK: no stale references"
exit $status
```

- [ ] **Step 3: Run it on the empty tree, expect OK**

Run: `mkdir -p skills && touch skills/.gitkeep && bash scripts/check-ported.sh`
Expected: `OK: no stale references`

- [ ] **Step 4: Commit**

```bash
chmod +x scripts/check-ported.sh
git add scripts skills && git commit -m "chore: add port check script"
```

---

### Task 2: Smoke project (the spike)

The riskiest assumption is the spec's "rename-only" port. Test it first, on a complete working project (root player build, scenes, Quarto render), so it doubles as the smoke-test bed and the source for Task 4's template. Lives outside this repo at `~/github/canvas-commons-smoke`.

**Files:**
- Create (outside repo): `~/github/canvas-commons-smoke/` (copy of the infosec project)
- Create (committed): `docs/superpowers/notes/2026-10-06-rename-spike.md`

**Interfaces:**
- Produces: a project where `make anim && quarto render` succeeds against `@canvas-commons/*`, plus the exact import-path, dependency and config rules, recorded under `Imports`, `Dependencies`, `Vite config`, `Failures` in the notes file. Tasks 3, 4, 6 and 7 apply these rules.

- [ ] **Step 1: Copy the whole project**

```bash
rsync -a --exclude node_modules --exclude dist --exclude .git --exclude _site \
  ~/github/conf-2025-working-with-infosec/ ~/github/canvas-commons-smoke/
cd ~/github/canvas-commons-smoke && git init -q
```

- [ ] **Step 2: Rewrite scope and dependencies**

```bash
grep -rl "@motion-canvas/" . --include='*.ts' --include='*.tsx' --include='*.json' | xargs sed -i 's#@motion-canvas/#@canvas-commons/#g'
```

Then edit both `package.json` files by hand: every `@canvas-commons/*` entry to `^0.4.0` (including `ffmpeg`, previously `^1.1.0`), `@canvas-commons/ui` to `@canvas-commons/editor`, and move `lezer-r` into `animations/package.json` only.

- [ ] **Step 3: Install and build both projects**

Run: `npm install && npm --prefix ./animations install && make anim 2>&1 | tail -40`
Expected: success, or concrete errors. Fix each in place and write the rule to the notes file (a changed subpath such as `@canvas-commons/2d/lib/components`, a renamed `CodeHighlighter` export, whether the vite plugin default export is unchanged, whether `editor` is needed at all).

- [ ] **Step 4: Render**

Run: `make quarto` (or `quarto render <deck>.qmd`) and open the output. Expected: at least one animation plays in a slide. Record anything that needed changing in the `.qmd` or extension.

- [ ] **Step 5: Add one scene each from PMDS (`hexagons`) and goes-paddling (`kayak`)**, register them in the project, rebuild. Expected: `dist/animations/<scene>.js` for both. Record Motion Canvas 3.13 vs 3.17 differences.

- [ ] **Step 6: Write the notes file and commit**

```bash
cd ~/github/quarto-canvas-commons-skill
git add docs/superpowers/notes && git commit -m "docs: record canvas-commons rename spike findings"
```

**Gate:** if the spike shows API changes beyond renames, stop and report to the user before Task 3.

---

### Task 3: Promote and port the four skills

**Files:**
- Create: `skills/motion-canvas-api/SKILL.md`, `skills/motion-canvas-api/references/api-reference.md`, `skills/motion-canvas-scene/SKILL.md`, `skills/motion-canvas-authoring/SKILL.md`, `skills/svg-to-motion-canvas/SKILL.md`
- Source: `~/github/conf-2025-working-with-infosec/.claude/skills/*/SKILL.md` and `.claude/motion-canvas.md`

**Interfaces:**
- Consumes: the Task 2 notes (apply its import and dependency rules, not just the scope rename).
- Produces: skill folders that Tasks 4 to 9 add files to.

- [ ] **Step 1: Copy sources**

```bash
SRC=~/github/conf-2025-working-with-infosec/.claude
for s in motion-canvas-api motion-canvas-scene motion-canvas-authoring svg-to-motion-canvas; do
  mkdir -p skills/$s && cp $SRC/skills/$s/SKILL.md skills/$s/SKILL.md
done
mkdir -p skills/motion-canvas-api/references
cp $SRC/motion-canvas.md skills/motion-canvas-api/references/api-reference.md
```

- [ ] **Step 2: Run the check script, expect FAIL (this is the red test)**

Run: `bash scripts/check-ported.sh`
Expected: FAIL listing `@motion-canvas/` lines.

- [ ] **Step 3: Apply the Task 2 rules**

Apply the scope rename and every import/dependency rule from the spike notes. Then review by hand: update `motion-canvas.github.io` and `github.com/motion-canvas` URLs to `canvascommons.io` (the npm metadata's homepage; the spec's `canvas-commons.github.io` is unverified, check which resolves with `curl -sI`), update the version table in `motion-canvas-scene` (the "Project dependencies" section, `^3.17.2` to `^0.4.0`), and fix `Colors.TEXT` to `#ACB3BF` wherever it appears. Mark any deliberate mention of the old scope with `PORT-NOTE`.

- [ ] **Step 4: Add the conventions note and fix the `description` fields**

Insert directly under each H1:

```markdown
> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.
```

Rewrite each `description:` to triggers only, e.g. for the API skill: `Use when writing or debugging Canvas Commons (formerly Motion Canvas) animation code and you need to know which node, signal, tween or layout property to use.` Keep "Motion Canvas" in the descriptions as a keyword, since users still say it.

- [ ] **Step 5: Run the check script, expect OK**

Run: `bash scripts/check-ported.sh`
Expected: `OK: no stale references`

- [ ] **Step 6: Retrieval check, then commit**

Dispatch one fresh subagent: "Using only `skills/motion-canvas-api`, tell me how to animate a node's position along a path with easing." Confirm it cites the skill and the answer uses `@canvas-commons/*` imports.

```bash
git add skills && git commit -m "feat: promote and port four skills to canvas commons"
```

---

### Task 4: Bootstrap and validate modes (early, so the skill can smoke-test projects)

The skill must do two things on request: **bootstrap** a new presentation project, and **validate** that an existing one works. Both are checklists Claude follows, not scripts. Template files are vendored into the skill so it works on any machine without the infosec project (a deliberate deviation from the spec's "copy from the WSL infosec project", which only works on one machine; the Quarto extension copy there stays the canonical source and the vendored copy is taken from it).

**Files:**
- Create: `skills/motion-canvas-scene/references/project-architecture.md`, `references/bootstrap.md`, `references/validate.md`
- Create: `skills/motion-canvas-scene/assets/project-template/` containing `package.json`, `vite.config.ts`, `motion-canvas-ts.html`, `Makefile`, `_extensions/andrie/motion-canvas/` (3 files), `animations/{package.json,vite.config.ts,tsconfig.json,global.css,src/motion-canvas.d.ts,src/scenes/.gitkeep,public/_fonts/.gitkeep}`, `smoke.qmd`
- Modify: `skills/motion-canvas-scene/SKILL.md`

**Interfaces:**
- Consumes: the working `~/github/canvas-commons-smoke` project and Task 2 rules (template = that project with scenes removed, `styles.ts` omitted until Task 6, `lezer-r` in `animations/package.json`).
- Produces: SKILL.md routing: "new presentation project" goes to `references/bootstrap.md`; "does my project work", "animation fails to build or render" goes to `references/validate.md`. Both reference files list steps as `command` plus `expected result`.

- [ ] **Step 1: Verify architecture claims against the reference project**

Run: `cat ~/github/conf-2025-working-with-infosec/{Makefile,vite.config.ts,motion-canvas-ts.html,package.json}`
Confirm: root output `dist/motion-canvas-ts.js`, `make anim` markers `dist/.build-complete` and `dist/animations/.build-complete`. Note differences from the spec.

- [ ] **Step 2: Build the template from the smoke project**

Copy the files listed above into `assets/project-template/`. `smoke.qmd` is a two-slide deck: a title slide, and one slide with `{{< motion-canvas ./animations/smoke.js auto fullscreen=true >}}` plus `.hidetitle`. Include one trivial `animations/src/scenes/smoke.tsx` and `animations/src/smoke.ts` registered in the template's `vite.config.ts`, so a fresh bootstrap renders something immediately.

- [ ] **Step 3: Write `project-architecture.md`**

Sections (sentence case): `Two projects, one dist folder`, `How the Makefile ties them together`, `Known quirk: lezer-r placement`. Prose from the spec's section 2, checked against Step 1.

- [ ] **Step 4: Write `bootstrap.md`**

Ordered steps, each with command and expected result. Confirm the target directory is empty first; never overwrite.
1. `cp -r <skill>/assets/project-template/. <target>/` (expected: `Makefile`, `package.json`, `animations/` present).
2. `npm install && npm --prefix ./animations install` (two independent trees; expected: both `node_modules`).
3. `make anim` (expected: `dist/motion-canvas-ts.js`, `dist/animations/smoke.js`).
4. `quarto render smoke.qmd` (expected: output HTML references `dist/motion-canvas-ts.js`; `_site` or output folder contains `dist/animations/smoke.js`).
5. Rename or replace `smoke.qmd` with the real deck; point the user to `quarto-presentation`.
After Task 5 lands, new scenes use `add-scene.js` (this step list is updated there).

- [ ] **Step 5: Write `validate.md`**

Read-only diagnosis, in this order, stopping at the first failure and naming the fix:
1. Both `package.json` files exist; `grep -r "@motion-canvas/" package.json animations/package.json animations/src` returns nothing; `lezer-r` appears in `animations/package.json` if any scene imports it.
2. Both `node_modules` directories exist.
3. Every `animations/src/*.ts` project file appears in `animations/vite.config.ts`'s `project` array (`for f in animations/src/*.ts; do grep -q "$(basename $f)" animations/vite.config.ts || echo "unregistered: $f"; done`).
4. `make force-build` succeeds; list `dist/` outputs.
5. The `.qmd` YAML has `resources:` including `dist/*/*` and `include-in-header` loading `dist/motion-canvas-ts.js`.
6. `diff -r _extensions/andrie/motion-canvas <skill>/assets/project-template/_extensions/andrie/motion-canvas` is empty (else the project uses an older extension copy; report which differences).
7. `quarto render` succeeds; the output references each animation JS file used.
Map each failure to the existing error tables in `SKILL.md`.

- [ ] **Step 6: Update `SKILL.md`**

Description (triggers only): `Use when starting a new Quarto presentation project that will contain Canvas Commons (Motion Canvas) animations, when checking that such a project builds, or when a scene fails to build or render.` Add a short "Starting or checking a project" section linking the two reference files.

- [ ] **Step 7: Exercise both modes (this is the smoke test)**

Bootstrap into a fresh directory `$SCRATCH/boot-test` following only `bootstrap.md`. Expected: all five steps pass. Then deliberately break it three ways (delete a registration line, add a stray `@motion-canvas/core` dependency, delete `dist/`) and run `validate.md` against each. Expected: each break is named at the right step. Fix wording where the checklist was ambiguous. Then dispatch a fresh subagent with only the skill and the prompt "set up a new Canvas Commons presentation project in `$SCRATCH/boot-agent`" and confirm it completes bootstrap unaided.

- [ ] **Step 8: Commit**

```bash
git add skills && git commit -m "feat: add bootstrap and validate modes to motion-canvas-scene"
```


---

### Task 5: Scene-lifecycle scripts (test first)

**Files:**
- Create: `skills/motion-canvas-scene/scripts/vite-project-array.js`, `add-scene.js`, `remove-scene.js`, `tests/scene-scripts.test.js`, `tests/fixtures/vite.config.ts`
- Modify: `skills/motion-canvas-scene/SKILL.md` (replace the four-step walkthrough)

**Interfaces:**
- Produces (`vite-project-array.js`, ES module):
  - `addEntry(source: string, entry: string): string`, inserts `"<entry>",` as the first item of the `project: [` array; returns source unchanged if already present; throws `Error('project array not found')` if there is no `project: [`.
  - `removeEntry(source: string, entry: string): string`, removes the line containing exactly that entry within the array; returns source unchanged if absent; throws if no array.
- Produces CLI: `node add-scene.js <name> [--root <animationsDir>]` and `node remove-scene.js <name> [--root <animationsDir>]`. `--root` defaults to `./animations`. Scene names must match `/^[a-z0-9][a-z0-9_-]*$/i`.

- [ ] **Step 1: Write the fixture (a copy of the real config, including its comment line)**

`tests/fixtures/vite.config.ts` is `~/github/conf-2025-working-with-infosec/animations/vite.config.ts` with `@motion-canvas/vite-plugin` changed to `@canvas-commons/vite-plugin`.

- [ ] **Step 2: Write the failing tests**

```javascript
// tests/scene-scripts.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {addEntry, removeEntry} from '../skills/motion-canvas-scene/scripts/vite-project-array.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const scripts = path.join(here, '../skills/motion-canvas-scene/scripts');
const fixture = fs.readFileSync(path.join(here, 'fixtures/vite.config.ts'), 'utf8');

test('addEntry inserts a new entry into the project array', () => {
  const out = addEntry(fixture, './src/demo.ts');
  assert.match(out, /project:\s*\[\s*"\.\/src\/demo\.ts",/);
  assert.ok(out.includes('"./src/hexagons.ts"'), 'existing entries kept');
});

test('addEntry is idempotent', () => {
  const once = addEntry(fixture, './src/demo.ts');
  assert.equal(addEntry(once, './src/demo.ts'), once);
});

test('removeEntry removes only the named entry, including the last one', () => {
  const out = removeEntry(fixture, './src/multi-database.ts');
  assert.ok(!out.includes('multi-database'));
  assert.ok(out.includes('"./src/infosec-triad.ts"'));
});

test('removeEntry on a missing entry leaves source unchanged', () => {
  assert.equal(removeEntry(fixture, './src/nope.ts'), fixture);
});

test('both throw when there is no project array', () => {
  assert.throws(() => addEntry('export default {}', './src/x.ts'), /project array not found/);
  assert.throws(() => removeEntry('export default {}', './src/x.ts'), /project array not found/);
});

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scene-'));
  fs.mkdirSync(path.join(root, 'src/scenes'), {recursive: true});
  fs.writeFileSync(path.join(root, 'vite.config.ts'), fixture);
  return root;
}

test('add-scene creates both files and registers the scene', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  const scene = fs.readFileSync(path.join(root, 'src/scenes/demo.tsx'), 'utf8');
  const proj = fs.readFileSync(path.join(root, 'src/demo.ts'), 'utf8');
  assert.match(scene, /@canvas-commons\/2d/);
  assert.match(proj, /import scene from '\.\/scenes\/demo\?scene'/);
  assert.match(fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8'), /"\.\/src\/demo\.ts"/);
});

test('add-scene refuses to overwrite an existing scene', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  assert.throws(() => execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root], {stdio: 'pipe'}));
});

test('add-scene rejects unsafe names', () => {
  const root = tmpProject();
  assert.throws(() => execFileSync('node', [path.join(scripts, 'add-scene.js'), '../evil', '--root', root], {stdio: 'pipe'}));
});

test('remove-scene deletes both files and the registration', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  execFileSync('node', [path.join(scripts, 'remove-scene.js'), 'demo', '--root', root]);
  assert.ok(!fs.existsSync(path.join(root, 'src/scenes/demo.tsx')));
  assert.ok(!fs.existsSync(path.join(root, 'src/demo.ts')));
  assert.ok(!fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8').includes('demo'));
});
```

- [ ] **Step 3: Run, expect FAIL (modules not found)**

Run: `node --test tests/`
Expected: FAIL, `Cannot find module .../vite-project-array.js`

- [ ] **Step 4: Implement `vite-project-array.js`**

```javascript
// Text-level edits of the `project: [...]` array in a Vite config.
// Deliberately not an AST edit: the array is the only thing we touch, and
// comments inside it (e.g. a commented-out entry) must survive.
const OPEN = /project:\s*\[/;

function arrayBounds(source) {
  const open = OPEN.exec(source);
  if (!open) throw new Error('project array not found');
  const start = open.index + open[0].length;
  const end = source.indexOf(']', start);
  if (end === -1) throw new Error('project array not found');
  return {start, end};
}

const quoted = (entry) => new RegExp(`^[ \\t]*["']${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'],?[ \\t]*\\r?\\n?`, 'm');

export function addEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  if (quoted(entry).test(source.slice(start, end))) return source;
  return `${source.slice(0, start)}\n        "${entry}",${source.slice(start)}`;
}

export function removeEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  const body = source.slice(start, end);
  return source.slice(0, start) + body.replace(quoted(entry), '') + source.slice(end);
}
```

- [ ] **Step 5: Implement the two CLIs**

```javascript
// add-scene.js
import fs from 'node:fs';
import path from 'node:path';
import {addEntry} from './vite-project-array.js';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const rootIdx = args.indexOf('--root');
const root = path.resolve(rootIdx >= 0 ? args[rootIdx + 1] : 'animations');

if (!name || !/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
  console.error('usage: add-scene.js <name> [--root <animationsDir>]  (name: letters, digits, - and _)');
  process.exit(1);
}
const scenePath = path.join(root, 'src/scenes', `${name}.tsx`);
const projectPath = path.join(root, 'src', `${name}.ts`);
const vitePath = path.join(root, 'vite.config.ts');
for (const p of [scenePath, projectPath]) {
  if (fs.existsSync(p)) { console.error(`refusing to overwrite ${p}`); process.exit(1); }
}

const registered = addEntry(fs.readFileSync(vitePath, 'utf8'), `./src/${name}.ts`); // throws before any write if no array
fs.mkdirSync(path.dirname(scenePath), {recursive: true});
fs.writeFileSync(scenePath, `import {makeScene2D, Rect} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();
  view.add(<Rect ref={rect} width={200} height={200} fill="#447099" scale={0} />);
  yield* rect().scale(1, 1);
  yield* waitFor(2);
});
`);
fs.writeFileSync(projectPath, `import {makeProject} from '@canvas-commons/core';
import scene from './scenes/${name}?scene';

export default makeProject({
  scenes: [scene],
});
`);
fs.writeFileSync(vitePath, registered);
console.log(`created ${scenePath}\ncreated ${projectPath}\nregistered ./src/${name}.ts in vite.config.ts\nnext: make anim`);
```

```javascript
// remove-scene.js
import fs from 'node:fs';
import path from 'node:path';
import {removeEntry} from './vite-project-array.js';

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const root = path.resolve(rootIdx >= 0 ? args[rootIdx + 1] : 'animations');

if (!name || !/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
  console.error('usage: remove-scene.js <name> [--root <animationsDir>]');
  process.exit(1);
}
const vitePath = path.join(root, 'vite.config.ts');
fs.writeFileSync(vitePath, removeEntry(fs.readFileSync(vitePath, 'utf8'), `./src/${name}.ts`));
for (const p of [path.join(root, 'src/scenes', `${name}.tsx`), path.join(root, 'src', `${name}.ts`)]) {
  fs.rmSync(p, {force: true});
}
console.log(`removed ${name}`);
```

If the Task 2 notes show `makeScene2D`/`Rect` live at a different subpath, change the skeleton's imports to match before Step 6.

- [ ] **Step 6: Run tests, expect PASS**

Run: `node --test tests/`
Expected: 9 tests pass. (ESM: add `{"type":"module"}` in a root `package.json` if Node reports a CommonJS error.)

- [ ] **Step 7: End-to-end check against a real build**

In `~/github/canvas-commons-smoke`: `node <repo>/skills/motion-canvas-scene/scripts/add-scene.js demo --root .` then `npm run build`. Expected: `dist/animations/demo.js` exists. Then run `remove-scene.js demo --root .` and rebuild; expected no `demo` output.

- [ ] **Step 8: Update `motion-canvas-scene/SKILL.md`**

Replace "Creating a new scene" steps 1 to 3 with: check `canvas-commons-library` first, then `node ~/.claude/skills/motion-canvas-scene/scripts/add-scene.js <name>`, then `make anim`. Keep the Build Commands and error tables; add a one-line note that the two registration errors are now prevented by the script.

- [ ] **Step 9: Commit**

```bash
git add tests skills package.json && git commit -m "feat: add add-scene and remove-scene scripts with tests"
```

- [ ] **Step 10: Update the bootstrap checklist**

In `references/bootstrap.md` add a step after `make anim`: "for each real scene, run `add-scene.js <name>` instead of copying files". Re-run Task 4 Step 7 (bootstrap into a fresh directory, then add one scene via the script, `make anim`). Expected: pass.

---

### Task 6: Shared component and style library

**Files:**
- Move: `seed/lib/styles/styles.ts` to `skills/canvas-commons-library/styles.ts`; `seed/lib/components/Database.tsx` to `.../components/Database.tsx`; `seed/lib/scenes/*.tsx` to `.../scenes/`
- Create: `skills/canvas-commons-library/utils/pulse.ts` (copy from PMDS: `find ~/github -path '*PMDS*' -name pulse.ts`; if PMDS is not on this machine, take it from `conf-2025-working-with-infosec/animations/src/utils/pulse.ts`)
- Create: `skills/canvas-commons-library/README.md` (how to import)

**Interfaces:**
- Produces: `Posit`, `Colors`, `BaseFont`, `WhiteLabel`, `BlackLabel` exported from `styles.ts`; `pulse(node, opts)` exported from `utils/pulse.ts`; a documented import form for projects: `import {Posit, Colors} from '../../../skills/canvas-commons-library/styles'` is brittle, so the README prescribes `ln -s ~/.claude/skills/canvas-commons-library animations/src/lib` and imports from `./lib/styles`.

- [ ] **Step 1: Move files with git mv, apply the Task 2 import rules and the scope rename**
- [ ] **Step 2: Assert the colour**

Run: `grep -n "TEXT" skills/canvas-commons-library/styles.ts`
Expected: `#ACB3BF`. Fix if not.

- [ ] **Step 3: Compile check in the smoke project**

Symlink the library to `~/github/canvas-commons-smoke/animations/src/lib`, change the `styles.ts` import in one scene to `./lib/styles`, run `npm run build`. Expected: success (this is the spec's shared-import test).

- [ ] **Step 4: Run `bash scripts/check-ported.sh`, expect OK; commit**

```bash
git add skills seed && git commit -m "feat: extract shared canvas-commons library"
```

---

### Task 7: `motion-canvas-r-code` skill

**Files:**
- Move: `seed/r-code/RHighlighter.ts` to `skills/motion-canvas-r-code/components/RHighlighter.ts`; `seed/r-code/{lezer-r.d.ts,global.css,shiny-ellmer-code.R}` to `skills/motion-canvas-r-code/assets/`
- Create: `skills/motion-canvas-r-code/SKILL.md`, `references/fonts-and-highlighting.md`

**Interfaces:**
- Consumes: Task 2 rule for the `CodeHighlighter` import path (the two `RHighlighter.ts` imports are the only edits; the logic stays verbatim).
- Produces: documented setup: `npm --prefix ./animations install lezer-r @lezer/common`, copy `RHighlighter.ts` to `animations/src/components/`, copy `lezer-r.d.ts` to `animations/src/`, import `../global.css` in the scene's project file.

- [ ] **Step 1: Move files, fix only the import lines in `RHighlighter.ts`; `git diff -M` should show a two-line change**
- [ ] **Step 2: Write `SKILL.md`**

Description (triggers only): `Use when showing R code in a Canvas Commons or Motion Canvas animation, when R code in a Code node has no syntax colours, or when a canvas text node renders in the wrong font.` Body: the two problems and their fixes in a short table (symptom, cause, fix), the setup list above, and the known pipe-operator gap (`|>`, `%>%` need a case in `RHighlighter`'s `switch`).

- [ ] **Step 3: Write `references/fonts-and-highlighting.md`**

Explain canvas text vs CSS font loading (`fontFamily` ignored unless the font is loaded in the document, loaded via `global.css` imported from the project entry file), the JetBrains Mono finding (named first but never loaded; Fira Code is what renders) and the recommendation to name only loaded fonts, and why `lezer-r` yields no highlight tags so `RHighlighter` walks node names (`node.parent.name === 'FunctionCall'` distinguishes function names).

- [ ] **Step 4: Fresh-install test**

In the smoke project: add `lezer-r` to `animations/package.json` only (not root), delete `node_modules`, run `npm install && npm run build` with a scene using `RHighlighter`. Expected: build succeeds.

- [ ] **Step 5: Visual check**

Build the ported `shiny-ellmer` scene, open it with Playwright (webapp-testing skill) or `npx vite preview`, take a screenshot, and confirm R colours and the font. Save the screenshot to `docs/superpowers/notes/shiny-ellmer.png`.

- [ ] **Step 6: Commit**

```bash
git add skills seed docs && git commit -m "feat: add motion-canvas-r-code skill"
```

---

### Task 8: SVG skill worked examples and seed cleanup

**Files:**
- Create: `skills/svg-to-motion-canvas/references/worked-examples.md`
- Modify: `skills/svg-to-motion-canvas/SKILL.md` ("Proven examples" section points to the new file), `seed/scenes/kayak.tsx`, `seed/scenes/*.tsx` (scope rename)

- [ ] **Step 1: Write `worked-examples.md`**: the three pairs (`seed/diagrams/infosec_triad.drawio.svg` with `seed/scenes/infosec-triad.tsx`, `multiple_sources` with `multi-database`, `llm_app` with `shiny-ellmer`), one short paragraph each on what the translation demonstrates, referencing files by repo path. The skill's own "Proven examples" section shrinks to a link, so there is one description, not two.
- [ ] **Step 2: Apply the scope rename to all `seed/scenes/*.tsx`; remove dead commented code and the stray `3` and `Rec` text nodes from `kayak.tsx`.**
- [ ] **Step 3: Build-check each seed scene** in the smoke project (register with `add-scene.js`-style entries). Expected: all seven build. Record any that don't in the spike notes rather than fixing silently.
- [ ] **Step 4: `bash scripts/check-ported.sh` (extend its grep paths to `seed` here), commit**

```bash
git add skills seed scripts && git commit -m "feat: add svg worked examples and port seed scenes"
```

---

### Task 9: Offline API and hierarchy generators

Highest-uncertainty task, so it comes after everything that doesn't depend on it.

**Files:**
- Create: `skills/motion-canvas-api/scripts/generate-api-search.js`, `generate-component-hierarchy.js`, generated `references/api-search-index.json`, `references/component-hierarchy.md`
- Modify: `skills/motion-canvas-api/SKILL.md` (point at the generated files)
- Source: `~/github/mcp-node-motion-canvas/mcp-node-motion-canvas/src/{tools,utils}/*.ts`, `scripts/*.js`

**Interfaces:**
- Consumes: a local clone of `canvas-commons/canvas-commons` passed as `--repo <path>`.
- Produces: `node generate-api-search.js --repo <path> --out references/api-search-index.json` and `node generate-component-hierarchy.js --repo <path> --out references/component-hierarchy.md`.

- [ ] **Step 1: Clone and confirm the docs build (spec open question 1)**

```bash
git clone --depth 1 https://github.com/canvas-commons/canvas-commons $SCRATCH/cc && cd $SCRATCH/cc
cat package.json | grep -A20 '"scripts"'
npm install && npx lerna run build 2>&1 | tail -20
```

Record which commands work. If `lerna` is gone, use whatever `package.json` defines; note it in `SKILL.md`.

- [ ] **Step 2: Read the sources to port**

Read `src/tools/{simplified-api-search,component-hierarchy}.ts` and `src/utils/{DocsProcessor,ContentCollector,SimpleSearch,search-utils,ComponentHierarchyLoader,hierarchy-utils}.ts`. Identify what is MCP-specific (tool registration, `zod` schemas, result formatting for MCP) and drop it. Keep: file collection, class/JSDoc extraction, fuzzy and synonym search data.

- [ ] **Step 3: Write a failing smoke test** (`tests/generators.test.js`) that runs each script against a small fixture package (`tests/fixtures/mini-repo/packages/2d/src/components/Shape.ts` with a class `Shape extends Node` and a JSDoc comment) and asserts: the hierarchy file contains `Node` above `Shape` and the JSDoc text; the search index JSON contains an entry for `Shape`. Run: `node --test tests/generators.test.js`, expected FAIL.
- [ ] **Step 4: Implement the two scripts** as standalone ES modules, using the `typescript` compiler API (already a dependency of the MCP project) loaded from `--ts <path>` or `require.resolve('typescript')`; keep the dependency list to `typescript` only and say so in the file header. Flat-file JSON output, ASCII tree output matching the original tool's default format.
- [ ] **Step 5: Run the smoke test, expect PASS; then run both scripts against the real clone and commit the generated files.** Spot-check: the index finds `Rect`, `Polygon`, `Code`; the hierarchy shows `Node > Layout > Shape`.
- [ ] **Step 6: Update `SKILL.md` and `api-reference.md` header: "regenerate only when Canvas Commons ships an API-affecting version; current data is for 0.4.0".**
- [ ] **Step 7: Commit**

```bash
git add skills tests && git commit -m "feat: add offline api search and hierarchy generators"
```

---

### Task 10: `quarto-presentation` additions (outside this repo)

**Files:**
- Modify: `~/.claude/skills/quarto-presentation/references/extensions.md` (the `andrie/motion-canvas` section, starting line 61)
- Create: `~/.claude/skills/quarto-presentation/references/motion-canvas-shortcode.md`

- [ ] **Step 1: Verify each mechanism claim in the source**

Run: `cat ~/github/conf-2025-working-with-infosec/_extensions/andrie/motion-canvas/motion-canvas.lua` and `grep -rn "motion-canvas\b.*background\|hidetitle" ~/github/conf-2025-working-with-infosec/*.qmd`. Confirm: `width` only emitted without `fullscreen`; `background` adds only `z-index: -1`; `loop` attribute only when `false`; `auto` only when `"true"`. If a claim doesn't hold, write what the Lua actually does and flag the spec discrepancy in the report.

- [ ] **Step 2: Invoke `writing-voice`, then write `motion-canvas-shortcode.md`** with sections: `Option mechanics` (table), `Section divider recipe` (`{{< motion-canvas ./animations/hexagons.js background fullscreen loop=false >}}`), `Hiding the slide title` (`.hidetitle` example from the spec). Lead with the answer.
- [ ] **Step 3: Draft the `extensions.md` edits**: one pointer line to the animation skills (and `motion-canvas-r-code` for code display), one line linking `motion-canvas-shortcode.md`, and the provenance note naming the infosec copy as canonical for `_extensions/andrie/motion-canvas/`.
- [ ] **Step 4: Show the diff and get the user's confirmation before saving**, since this changes a global skill outside the repo. Then apply and keep a copy of both in `docs/superpowers/notes/quarto-presentation-additions/` for the record.
- [ ] **Step 5: Commit the repo copy**

```bash
git add docs && git commit -m "docs: record quarto-presentation additions"
```

---

### Task 11: Install and validate

**Files:**
- Create: `scripts/install.sh`

- [ ] **Step 1: Write the installer**

```bash
#!/usr/bin/env bash
# Symlink each skill into ~/.claude/skills so this repo stays the source of truth.
set -eu
cd "$(dirname "$0")/.."
for d in skills/*/; do
  name=$(basename "$d")
  target="$HOME/.claude/skills/$name"
  if [ -e "$target" ] && [ ! -L "$target" ]; then echo "SKIP $name: real directory exists"; continue; fi
  ln -sfn "$PWD/$d" "$target" && echo "linked $name"
done
```

- [ ] **Step 2: Run it; expect six links, no SKIPs**

Run: `bash scripts/install.sh && ls -l ~/.claude/skills | grep -E 'motion|canvas|svg'`

- [ ] **Step 3: Full verification**

Run `bash scripts/check-ported.sh`, `node --test tests/`, `wc -w skills/*/SKILL.md` (flag any SKILL.md over about 500 words that isn't a reference-heavy skill, and move detail into `references/`). In a new session, ask for "a new animation scene for a Quarto deck" and confirm the skills trigger and `add-scene.js` is used.

- [ ] **Step 4: Commit and report**

```bash
git add scripts && git commit -m "chore: add installer"
```

Report to the user: what passed, what the spike changed, the `ui` to `editor` decision, anything skipped. The Positron talk (spec section 11) is the follow-up end-to-end test and is not part of this plan.

---

## Self-review against the spec

| Spec item | Task |
|---|---|
| 1 promote four skills; 2 Canvas Commons port; 4 reconcile `Colors.TEXT` | 3 (plus 2 as the de-risking spike) |
| 3 shared library | 6 |
| 5 generation scripts and first reference data | 9 |
| 6 add/remove scene scripts | 5 |
| 7 `motion-canvas-r-code` incl. `lezer-r` fix | 7 |
| 8 seed content | 8 (files already staged; port and clean) |
| 9 extension provenance note; 11 cross-reference and shortcode file | 10 |
| 10 architecture and bootstrap, plus validate mode (added at the user's request) | 4 (moved early) |
| 12 Positron validation | Out of this plan, noted in Task 11 |
| Testing section: build one scene per project, shared-library import, fresh install, shiny-ellmer visual | Tasks 2, 4, 6, 7 |

Open questions carried from the spec are scheduled, not deferred: docs-build commands (Task 9 Step 1), pipe-operator gap (documented in Task 7). New open item: the docs URL (`canvascommons.io` per npm metadata vs the spec's `canvas-commons.github.io`), resolved in Task 3 Step 3 with `curl`.
