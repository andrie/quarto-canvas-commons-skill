# quarto-presentation additions (staged, not applied)

These are staged drafts for the global `quarto-presentation` skill. Nothing under `~/.claude` has been changed.

Apply with:

```bash
cd ~/.claude/skills/quarto-presentation && cp /home/andrie/github/quarto-canvas-commons-skill/docs/superpowers/notes/quarto-presentation-additions/motion-canvas-shortcode.md references/ && patch -p0 < /home/andrie/github/quarto-canvas-commons-skill/docs/superpowers/notes/quarto-presentation-additions/extensions.md.patch
```

(`git apply -p0` also works for the patch.)

## What each change does

- `motion-canvas-shortcode.md` is the new `references/` file: option mechanics, the section-divider recipe and `.hidetitle`, for the `canvas-commons` extension (0.4.0 or later).
- `extensions.md.patch` replaces the `andrie/motion-canvas` section of `references/extensions.md` with `andrie/canvas-commons`: the install command, the single `resources: dist/**` entry (no script tag, no `filters:` entry), the options including `auto=false`, a pointer to the animation skills and one link to the new file. It was regenerated against the current `extensions.md` and checked with `patch --dry-run`.

Not covered: `references/andrie-style.md` still calls the element `<motion-canvas-player>` in its section on the `animation:` title-slide hook, which is part of the house theme.
