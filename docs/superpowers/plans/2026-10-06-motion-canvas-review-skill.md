# motion-canvas-review skill implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `motion-canvas-review` skill that reviews a Canvas Commons scene for reuse opportunities and reports ranked findings.

**Architecture:** A new skill folder with a short `SKILL.md` (process, signals, decision ladder, report format) and one reference file holding a worked example built from the Positron IDE mockup scene. `motion-canvas-authoring` gains one pointer line. A small test pins the frontmatter rules, and the existing installer test learns the new skill name.

**Tech stack:** Markdown skills, Node 22 `node --test`, bash installer, Canvas Commons 0.4.0 for building the example snippets.

**Spec:** `docs/superpowers/specs/2026-10-06-motion-canvas-review-skill-design.md`

## Global Constraints

- Canvas Commons 0.4.0: import from `@canvas-commons/core` and `@canvas-commons/2d` only, `anchor` not `offset`, no `language` prop on `Code`.
- New prose: UK English, no em-dashes, sentence-case headings, no hard-wrapping.
- Skill `description` states triggers only ("Use when..."), never the workflow.
- Do not edit the global `quarto-presentation` skill, the untracked addendum, or `canvas-commons-library`.
- Never run `scripts/install.sh` against the real home. Use `--dry-run` and `--target <tmp dir>`.
- Do not commit `.meta`, `dist/`, `node_modules/` or review reports.
- Commit trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Tests are run with `TS_PATH=/path/to/node_modules/typescript node --test tests/*.test.js` (glob, not the directory).

## Review Focus

- A scene with no repetition: the review must report "nothing to extract" and not invent findings.
- A scene with exactly two repeats: the "don't extract" rule must stop it recommending a component.
- A scene that already imports a library component or helper: the review must not recommend rewriting what exists.
- A scene file that is not a Canvas Commons scene (plain TypeScript): the skill must say it does not apply.
- A suggested extraction that changes behaviour (snap becoming a tween): the report must list it under risk.

## Task 1: skill skeleton and frontmatter test

**Files:**
- Create: `tests/skills.test.js`
- Modify: `tests/install.test.js:12-13`
- Create: `skills/motion-canvas-review/SKILL.md`

**Interfaces:**
- Produces: the skill name `motion-canvas-review` and the reference path `references/positron-scene-review.md` (created in Task 2).

- [ ] **Step 1: Write the failing tests**

Create `tests/skills.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const skillsDir = path.join(__dirname, '..', 'skills');
const skills = fs.readdirSync(skillsDir).filter(d =>
  fs.existsSync(path.join(skillsDir, d, 'SKILL.md')));

function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, `${file} has no frontmatter`);
  return Object.fromEntries(m[1].split('\n').map(l => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
}

for (const name of skills) {
  test(`${name}: name matches folder and description is a trigger`, () => {
    const fm = frontmatter(path.join(skillsDir, name, 'SKILL.md'));
    assert.strictEqual(fm.name, name);
    assert.match(fm.description, /^Use when /);
  });
}

test('motion-canvas-review exists and links its reference file', () => {
  assert.ok(skills.includes('motion-canvas-review'));
  const dir = path.join(skillsDir, 'motion-canvas-review');
  const body = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const link = 'references/positron-scene-review.md';
  assert.ok(body.includes(link));
  assert.ok(fs.existsSync(path.join(dir, link)));
});

test('new prose has no em-dashes', () => {
  const dir = path.join(skillsDir, 'motion-canvas-review');
  for (const f of ['SKILL.md', 'references/positron-scene-review.md']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) assert.ok(!fs.readFileSync(p, 'utf8').includes('—'), f);
  }
});
```

In `tests/install.test.js`, add `'motion-canvas-review'` to the `expected` array on lines 12-13.

- [ ] **Step 2: Run the tests to see them fail**

Run: `TS_PATH=$TS_PATH node --test tests/skills.test.js tests/install.test.js`
Expected: FAIL. `motion-canvas-review exists` fails, and the install test fails because the folder is missing. If an existing skill fails the `Use when` check, stop and report it instead of changing that skill.

- [ ] **Step 3: Write SKILL.md**

Create `skills/motion-canvas-review/SKILL.md` with this content:

````markdown
---
name: motion-canvas-review
description: Use when reviewing, tidying or refactoring a Canvas Commons (formerly Motion Canvas) scene, or after generating one, to find repeated code that should be a helper or component.
---

# Reviewing a scene for reuse

Review a scene for repeated or hand-built code that a helper, a function component or a class component would remove. Report findings and advise. Do not rewrite the scene unless the user asks.

This applies to Canvas Commons scenes (`makeScene2D` files). If the file is not one, say so and stop.

## Process

1. Read the whole scene before judging any part of it.
2. Scan for the signals below and note the line range of each hit.
3. Give each hit a level from the ladder, or "leave inline".
4. Check the project and `motion-canvas-authoring` for something that already does the job before suggesting new code.
5. Write the report in the format at the end.

If nothing qualifies, say "nothing to extract" and give the reason. Do not invent findings.

## Signals

- A block repeats with only strings or numbers changing.
- Positions are built from shared offsets such as `top + titleH + i * 68`. Flex layout (`layout`, `direction`, `gap`, `grow`) or a parent node with local coordinates removes the arithmetic. For windows, see `motion-canvas-authoring/references/app-window-mockup.md`.
- Children are changed by index, such as `chip.children()[0] as Rect`. The structure and the code that edits it are coupled, so make the parts props or signals.
- One state change needs several imperative `.text()`, `.fill()` or `.opacity()` calls on different nodes. Put the state in signals on a class so one call drives them all, and so the change can tween instead of snap.
- Palettes, highlighters or generic helpers such as `typeCode` sit inside a scene that another scene could use.
- The scene rebuilds something the project or `motion-canvas-authoring` already provides: a library component, `pulse`, the window mockup helper.

## Decision ladder

1. **Plain helper function.** Stateless, and a loop or formula drives the instance count. It returns one shape and takes positional arguments (`gridPoly(ref, x, y, size, opacity)`).
2. **Function component.** About 3 to 10 similar instances, each overriding one or two properties. A plain function taking a props object and spreading `{...props}`. No decorators and no signals of its own.
3. **Class component.** Properties must change after creation, or one piece of state drives several nodes. It extends `Layout` or `Rect`, with `@signal()` props, as in the `Database` sketch in `motion-canvas-authoring`.

Choose the lightest level that works. Move up only when a lighter one needs manual wiring to do the same.

## Leave it inline

- Fewer than three uses.
- A one-off layout that nothing else will repeat.
- Two instances that differ in structure and not only in values.

## Where the result lives

Scene-local first. When a second scene needs it, move it to the project's `animations/src/components/`. A project using this skill never edits `canvas-commons-library`; suggest that only to the library's owner.

## Report format

One entry per finding, most valuable first:

- **Where:** line range, or call count.
- **Signal:** which signal from above.
- **Level:** helper, function component, class component, existing pattern, or leave inline.
- **Saving:** lines removed, estimated and labelled as an estimate.
- **Risk:** any behaviour change, for example a snap becoming a tween, or a ref that must now be passed through.

`references/positron-scene-review.md` is a worked example: a long IDE mockup scene, the findings it produces, and the code before and after for three of them.
````

- [ ] **Step 4: Create an empty reference placeholder so the link test can pass in Task 2**

Do not create it now. The link test is expected to still fail until Task 2. Run the other tests:

Run: `TS_PATH=$TS_PATH node --test tests/skills.test.js tests/install.test.js`
Expected: install test PASS; frontmatter tests PASS; only `exists and links its reference file` FAILS on the missing reference.

- [ ] **Step 5: Commit**

```bash
git add tests/skills.test.js tests/install.test.js skills/motion-canvas-review/SKILL.md docs/superpowers/specs/2026-10-06-motion-canvas-review-skill-design.md docs/superpowers/plans/2026-10-06-motion-canvas-review-skill.md
git commit -m "feat(motion-canvas-review): add the reuse review skill skeleton" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Run `git show --stat HEAD` and confirm only those files are in the commit. Leave the untracked addendum alone.

## Task 2: worked-example reference, built and verified

**Files:**
- Create: `skills/motion-canvas-review/references/positron-scene-review.md`

**Interfaces:**
- Consumes: the SKILL.md report format and ladder names from Task 1 (helper, function component, class component, existing pattern, leave inline).
- Produces: the file `references/positron-scene-review.md` that the Task 1 test links.

- [ ] **Step 1: Bootstrap a scratch project**

Use the `motion-canvas-scene` skill's bootstrap into a scratch directory under the scratchpad, not into the repo. Confirm `make anim` builds the smoke scene.

Run: the bootstrap command from `skills/motion-canvas-scene/SKILL.md`, then `make anim` in the scratch project.
Expected: build succeeds.

- [ ] **Step 2: Write the three extractions as a scratch scene**

In the scratch project create `animations/src/review-example.tsx` containing these three pieces plus a minimal scene that uses each at least twice, then register it with `add-scene.js`.

```tsx
import {Layout, Rect, Txt, initial, signal, makeScene2D} from '@canvas-commons/2d';
import type {RectProps} from '@canvas-commons/2d';
import {all, createRef, easeOutCubic, type PossibleColor, type SignalValue, type SimpleSignal} from '@canvas-commons/core';
import {Posit} from '../styles';

const UI = 'system-ui, sans-serif';
const MONO = 'monospace';
const App = {chrome: '#181818', editor: '#1F1F1F', fg: '#CCCCCC', muted: '#6E7681', accentFg: '#C1D6E8', input: '#313131'};

// Level 2: function component. Replaces two hand-placed tabs.
interface EditorTabProps {
  ref?: any;
  label: string;
  active?: boolean;
}
function EditorTab({ref, label, active = false}: EditorTabProps) {
  return (
    <Rect ref={ref} width={260} height={44} fill={active ? App.editor : App.chrome}
          justifyContent="center" alignItems="center">
      <Txt text={label} fontFamily={UI} fontSize={20} fill={active ? '#FFFFFF' : App.muted} />
    </Rect>
  );
}

// Level 1: plain helper. Replaces five hand-placed Txt nodes per variables list.
function VarRow(name: string, type: string) {
  return (
    <Layout layout direction="row" gap={40}>
      <Txt text={name} fontFamily={MONO} fontSize={22} fill="#9CDCFE" width={70} />
      <Txt text={type} fontFamily={MONO} fontSize={22} fill={App.fg} />
    </Layout>
  );
}

// Level 3: class component. One accent and one label drive the dot and the text,
// so a chip can switch from Python to R with a tween and no children()[0] casts.
interface FeatureChipProps extends RectProps {
  label?: SignalValue<string>;
  accent?: SignalValue<PossibleColor>;
}
class FeatureChip extends Rect {
  @initial('') @signal()
  public declare readonly label: SimpleSignal<string, this>;

  @initial(Posit.blue) @signal()
  public declare readonly accent: SimpleSignal<PossibleColor, this>;

  public constructor(props?: FeatureChipProps) {
    super({
      layout: true, alignItems: 'center', gap: 16, padding: [0, 24],
      width: 480, height: 52, fill: App.input, radius: 6,
      lineWidth: 2, stroke: App.accentFg, ...props,
    });
    this.add(
      <>
        <Rect size={12} radius={6} fill={() => this.accent()} />
        <Txt text={() => this.label()} fontFamily={UI} fontSize={22} fill={App.fg} />
      </>,
    );
  }
}

export default makeScene2D(function* (view) {
  const chip = createRef<FeatureChip>();
  view.add(
    <Layout layout direction="column" gap={24} alignItems="center">
      <Layout layout direction="row">
        <EditorTab label="analysis.py" active />
        <EditorTab label="analysis.R" />
      </Layout>
      <Layout layout direction="column" gap={8}>
        {VarRow('df', 'DataFrame (344 x 8)')}
        {VarRow('pd', 'module')}
      </Layout>
      <FeatureChip ref={chip} label="Pyrefly language server" accent={Posit.blue} />
    </Layout>,
  );
  yield* all(
    chip().label('Air formatter', 0.4),
    chip().accent(Posit.teal, 0.4, easeOutCubic),
  );
});
```

Adjust only what the build forces. If `ref` is not accepted as a function-component prop, or `label` as a tweenable string signal fails, record the working form and the error message for the reference file.

- [ ] **Step 3: Build and render**

Run: `make anim` in the scratch project, then the `screenshot-slide.mjs` script from the `motion-canvas-scene` skill at an offset after the tween.
Expected: build succeeds with no type errors; the screenshot shows two tabs (first active), two variable rows and a chip reading "Air formatter" with a teal dot.

If the build fails, fix the snippet, and note the fix in the reference file as a gotcha.

- [ ] **Step 4: Write the reference file**

Create `skills/motion-canvas-review/references/positron-scene-review.md` with these sections, in UK English, no em-dashes, no hard-wrapping:

1. `# Worked example: reviewing an IDE mockup scene`: one paragraph on the scene (about 330 lines, a Positron-style window with Python and R tabs, console, variables, plots, status bar and three feature chips), and that the snippets are illustrative and not importable.
2. `## Findings`: the report in the SKILL.md format, most valuable first, with line ranges described by element (for example "tab rects and tab labels") instead of numbers that would rot:
   - Window chrome built from `top`/`left`/`cy` arithmetic: existing pattern (`app-window-mockup.md`); saving: most of the offset maths, estimated; risk: pane sizes reflow if the window size changes.
   - Feature chips mutated by `chip.children()[0] as Rect` and a `pythonFeatures[i]` baked into the JSX: class component `FeatureChip`; risk: the colour and text now tween instead of snapping.
   - Two near-identical tabs: function component `EditorTab`; risk: none.
   - Two variables lists repeating five `Txt` nodes: plain helper `VarRow`; risk: none.
   - Panel labels (`CONSOLE`, `VARIABLES`, `PLOTS`): plain helper; three uses, so borderline; say so.
   - Session switch (`sessionTxt`, `statusLang`, `statusTools`, `dot`, tab fills) driven by separate calls: class component with a `session` signal on the window; risk: larger change, do it only if a second scene reuses the window.
   - Palettes `P`, `T`, highlighters, and `typeCode` in the scene: move to a project module when a second scene needs them.
   - Plot bars and line numbers: already loops, leave inline.
3. `## Before and after`: for `FeatureChip`, `EditorTab` and `VarRow`, the original code shape (a short excerpt from the pasted scene) followed by the verified snippet from Step 2.
4. `## Gotchas found while building`: anything Step 2 or 3 recorded. If there were none, state that the snippets built unchanged.

- [ ] **Step 5: Run the tests**

Run: `TS_PATH=$TS_PATH node --test tests/*.test.js`
Expected: all PASS, including the link test and the em-dash test.

- [ ] **Step 6: Commit**

```bash
git add skills/motion-canvas-review/references/positron-scene-review.md
git commit -m "docs(motion-canvas-review): add the worked IDE mockup review example" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git show --stat HEAD
```

Confirm only that file is in the commit.

## Task 3: wire the skill into the repo

**Files:**
- Modify: `skills/motion-canvas-authoring/SKILL.md` (after the Style Conventions list at the end)
- Modify: `README.md:8-9` area
- Modify: `CLAUDE.md:8`

**Interfaces:**
- Consumes: the skill name `motion-canvas-review`.

- [ ] **Step 1: Add the authoring pointer**

Append to `skills/motion-canvas-authoring/SKILL.md`:

```markdown

## Before you finish a scene

Run the `motion-canvas-review` skill on it. It finds repeated blocks, hand-built offsets and state changes that a helper or component would simplify.
```

- [ ] **Step 2: Add the README entry**

In `README.md`, after the `svg-to-motion-canvas` bullet, add:

```markdown
- `motion-canvas-review`: review a scene for repeated code that a helper or component would remove. Includes a worked example on an IDE mockup scene.
```

- [ ] **Step 3: Update the CLAUDE.md layout line**

Change the `CLAUDE.md` line starting "- `skills/motion-canvas-api`, `motion-canvas-authoring`, ..." so the list reads `motion-canvas-api`, `motion-canvas-authoring`, `motion-canvas-review`, `svg-to-motion-canvas`, `motion-canvas-r-code`.

- [ ] **Step 4: Check the installer picks it up**

Run: `bash scripts/install.sh --dry-run --target "$(mktemp -d)"`
Expected: a line `dry-run: would link motion-canvas-review -> <repo>/skills/motion-canvas-review`. Do not run it without `--dry-run` and `--target`.

- [ ] **Step 5: Run all checks**

Run: `TS_PATH=$TS_PATH node --test tests/*.test.js && bash scripts/check-ported.sh`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/motion-canvas-authoring/SKILL.md README.md CLAUDE.md
git commit -m "docs: point authoring at the new review skill and list it in the README" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git show --stat HEAD
```

## Task 4: behavioural test of the skill

**Files:**
- None committed. Scratch material goes in the scratchpad directory.

**Interfaces:**
- Consumes: the installed skill text (read directly from `skills/motion-canvas-review/SKILL.md`, since nothing is installed into `~/.claude`).

- [ ] **Step 1: Save the test scenes**

In the scratchpad, save: (a) the pasted Positron scene as `positron.tsx`; (b) a scene with no repetition (one box, one label, one arrow); (c) a scene with exactly two repeated boxes; (d) a plain TypeScript file with no `makeScene2D`.

- [ ] **Step 2: Baseline run without the skill**

Dispatch one subagent per scene with the prompt "Review this Canvas Commons scene for code that could be made reusable. Report findings." and no skill text. Record each report.

- [ ] **Step 3: Run with the skill**

Dispatch one subagent per scene with the same prompt plus the full text of `skills/motion-canvas-review/SKILL.md` and the reference file. Record each report.

- [ ] **Step 4: Check the reports against the scenes yourself**

Pass criteria, each checked against the scene text and not the subagent's claim:
- (a) The with-skill report names the `children()[0]` mutation, the unused window pattern, and assigns a level to each finding, with a risk line. The baseline report is allowed to find some of these; record the difference.
- (b) Says nothing to extract.
- (c) Says leave inline, citing fewer than three uses.
- (d) Says the skill does not apply.
- No finding recommends editing `canvas-commons-library`.

- [ ] **Step 5: Fix and repeat if a criterion fails**

If a criterion fails, change the wording in `SKILL.md` that should have prevented it, re-run only the failing scene, and commit the change with `fix(motion-canvas-review): ...`. Re-run `node --test tests/*.test.js` before committing.

- [ ] **Step 6: Report**

Summarise the with and without comparison for the owner, including any criterion that still fails. Do not claim the skill works beyond the four scenes tested.
