# quarto-presentation additions (staged, not applied)

These are staged drafts for the global `quarto-presentation` skill. Nothing under `~/.claude` has been changed.

Apply with:

```bash
cd ~/.claude/skills/quarto-presentation && cp /home/andrie/github/quarto-canvas-commons-skill/docs/superpowers/notes/quarto-presentation-additions/motion-canvas-shortcode.md references/ && patch -p0 < /home/andrie/github/quarto-canvas-commons-skill/docs/superpowers/notes/quarto-presentation-additions/extensions.md.patch
```

(`git apply -p0` also works for the patch.)

## What each change does

- `motion-canvas-shortcode.md` is the new `references/` file: option mechanics, the section-divider recipe, `.hidetitle`, and which extension generation it describes.
- `extensions.md.patch` fixes the example paths to `./animations/src/<name>.js`, drops the ineffective `width="50%"` example line and annotates the option list, renames `<motion-canvas-player>` to `<canvas-commons-player>`, adds one pointer to the animation skills, one link to the new file, and a provenance note.

## Where the code differs from the spec (the code wins)

- `width="..."` is not just dropped under `fullscreen`: even without `fullscreen` it is emitted outside the `style` attribute (`width:50%;` as a bare attribute), so the browser ignores it and the player stays at the injected 75%. Verified in rendered HTML. The `kayak.js width="50%"` example in `extensions.md` therefore has no effect with this extension. The patch drops that example line and annotates `width` in the option list.
- `auto` omitted does not mean "do not autoplay": the JS sets `auto="true"` on the current slide on every slide change regardless. `auto=false` and omitting it produce the same HTML.
- The section-divider recipe does not use `.hidetitle`: the real divider (`# Solutions` in infosec.qmd) keeps its heading visible over the animation. `.hidetitle` is for slides whose whole content is the animation.
- `fullscreen`/`background`/`loop`/`auto` claims otherwise match the Lua. The Lua is identical between the pre-fork and vendored copies except for the element name.
- The spec's `./animations/hexagons.js` recipe path is wrong for this layout, and the real decks already use `./animations/src/`.
- `.hidetitle` is already defined in the house `andrie-slides.scss`, so only non-house themes need the CSS (given in the new file).
