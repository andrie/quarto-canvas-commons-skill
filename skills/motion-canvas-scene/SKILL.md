---
name: motion-canvas-scene
description: Use when starting a new Quarto presentation project that will contain Canvas Commons (Motion Canvas) animations, when adding Canvas Commons animations to an existing Quarto project, when adding, creating or removing a scene in an existing project, when checking that such a project builds, when a scene fails to build or render, or when updating a project that an older version of this skill set up.
---

# Creating, Building, and Debugging Scenes

> **Project conventions assumed:** `animations/src/` holds scene sources, `animations/vite.config.ts` registers scenes in its `project` array, and `make anim` builds. If a project differs, say so before proceeding.

## Starting or checking a project

- New presentation project (an empty directory, or "set up a project for animated slides"), or adding Canvas Commons to an existing project such as a Quarto deck that already has its own `Makefile`, `package.json` or `.gitignore`: follow `references/bootstrap.md`. It asks the user for the deck name, copies the template in `assets/project-template/` into the project root without overwriting anything, merges where files already exist, then installs, builds and renders the deck.
- The skill was updated and an existing project should catch up ("upgrade", "update my Canvas Commons setup"), or a project predates the bundled player: follow `references/upgrade.md`. It runs `scripts/upgrade-project.js`, which prints a plan, applies the safe steps and asks before deleting anything. Before adding a scene to, or validating, a project you did not set up in this session, run `node <skill>/scripts/upgrade-project.js --root <target>` without flags: if it reports anything but `up to date`, tell the user and offer the upgrade first.
- "Does my project work?", or an animation fails to build or render: follow `references/validate.md`, a read-only checklist that starts from the deck the Makefile names, stops at the first failure and points back to the error tables in `references/errors.md`.
- "Does the scene look right?": take screenshots of its slide at chosen moments with `scripts/screenshot-slide.mjs`, as in "Check the scene visually" at the end of `references/validate.md`. Building and rendering do not show this.
- How the root project, `animations/` and the Makefile fit together: `references/project-architecture.md`.

## Creating a new scene

1. Check `canvas-commons-library` first: the animation you want may already exist there.
2. Run the script from the project root (the directory with the `Makefile`):

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/add-scene.js <name>
   ```

   It writes `animations/src/scenes/<name>.tsx` (a skeleton scene) and `animations/src/<name>.ts` (the project file, with the required `?scene` import), and registers `./src/<name>.ts` in the `project` array of `animations/vite.config.ts`. It refuses to overwrite an existing scene. Use `--root <animationsDir>` when you are not in the project root.
3. Edit the scene, then build:

   ```bash
   make anim
   ```

   Reference the result in the deck as `{{< canvas-commons ./animations/src/<name>.js fullscreen=true >}}`.
4. Render the deck and look at the scene: "Check the scene visually" in `references/validate.md`.

To delete a scene, run `node ${CLAUDE_SKILL_DIR}/scripts/remove-scene.js <name>`. It removes the scene and project files, their `.meta` files (`src/<name>.meta`, `src/scenes/<name>.meta`, which the build writes), the registration, and the built bundle (`dist/animations/src/<name>.js` with any `<name>.*` file next to it, such as a source map), and prints each file it deleted. The next `make anim` empties `dist/animations/` and rebuilds it, so nothing stale survives; a project from an older template needs the `emptyOutDir` patch in `references/validate.md`, check 4.

The script prevents the two registration errors in `references/errors.md` (a missing `?scene` import and an unregistered project file).

## Build Commands

| Command | Description |
|---------|-------------|
| `make anim` | Incremental build (preferred — skips if sources unchanged) |
| `make force-build` | Full rebuild (ignores timestamps) |
| `npm --prefix ./animations run build` | Direct build (runs `tsc && vite build`) |
| `make serve` | Live preview with hot reload (vite dev server) |
| `make quarto` | Build animations + render the deck named by `QMD_FILE` |
| `make preview` | Build animations + live Quarto preview on port 4200 |

Every target in the `Makefile` has a comment saying what it does.

The build pipeline runs:
1. **`tsc`** — TypeScript compilation (catches type errors)
2. **`vite build`** — bundling to `dist/animations/src/` (catches import/config errors)

Output goes to `dist/animations/src/<name>.js`. The shortcode references it as `./animations/src/<name>.js`, which the player resolves relative to `dist/`.

## Style configuration

A bootstrapped project ships `animations/src/styles.ts`, a snapshot copy of `canvas-commons-library/styles.ts` (the library file is canonical, and a test keeps the two identical). **Read it at runtime** for current values. From a scene in `animations/src/scenes/`, import it as `../styles`.

It contains:
- `Colors` object: background, surface, syntax highlighting colours (KEYWORD, TEXT, FUNCTION, STRING, NUMBER, PROPERTY, COMMENT), basic colours (red, green, blue, white, black)
- `Posit` object: brand colours (blue `#447099`, orange `#EE6331`, gray `#404041`, white, teal `#419599`, green `#72994E`, burgundy `#9A4665`)
- `BaseFont`: `{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: 28 }`
- `WhiteLabel`, `BlackLabel`: preset text styles

The template has no `theme.scss`. Deck theming (Posit blue shades, fonts, heading styles) is a Quarto deck matter: hand it to the `quarto-presentation` skill.

## Shared components and utilities

A bootstrapped project has none of these by default. They come from the optional library symlink, `animations/src/lib` (see `references/bootstrap.md`, step 6, and the `canvas-commons-library` README). Import from `./lib/...`, or `../lib/...` from a scene.

- **Database** (`../lib/components/Database`): a 3D database cylinder (top ellipse, bottom half-ellipse, vertical sides). Props: `size`, `stroke`, `lineWidth`, `position`. Extends Layout.
- **pulse** (`../lib/utils/pulse`): scales an element up then down for emphasis. `yield* pulse(element, { scaleGrowth: 0.1, duration: 0.5 })`
- **Library scenes** (`../lib/scenes/...`): ready-made scenes such as `hexagons`. See the library README for how to register one.
- **RHighlighter**: not in the library. It is a syntax highlighter for R code that ships with the `motion-canvas-r-code` skill, which has its own setup steps.

## More detail

- `references/errors.md`: the tables of TypeScript, Vite and runtime errors with their fixes, including the blank animation player. Check it when a build or render fails.
- `references/build-notes.md`: importing images into scenes, deploying a deck to Posit Connect, and the project's dependencies.
