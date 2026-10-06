# The motion-canvas shortcode: option mechanics

Use `{{< motion-canvas ./animations/src/NAME.js background fullscreen loop=false >}}` for a section-divider background, and `{{< motion-canvas ./animations/src/NAME.js auto fullscreen >}}` for a full-slide animation. Everything below explains why, so you can pick options without guessing.

This file describes the **fork-era** extension (version 0.2.0, element `canvas-commons-player`). The canonical copy for Canvas Commons projects is `skills/motion-canvas-scene/assets/project-template/_extensions/andrie/motion-canvas/` in the `quarto-canvas-commons-skill` repository. The canonical pre-fork version is the copy in the `conf-2025-working-with-infosec` project on the WSL machine. The two differ only in the element name: the pre-fork Lua emits `<motion-canvas-player>`, the fork-era Lua emits `<canvas-commons-player>`, and the option logic is identical line for line.

## Paths and the player element

The shortcode's first argument is the path to the built animation, and it is `./animations/src/<name>.js`. The build writes the file to `dist/animations/src/<name>.js`, and the player resolves the shortcode path relative to the bundle in `dist/`, so the `dist/` prefix is not written in the shortcode.

The shortcode emits a `<canvas-commons-player>` custom element. It is defined by the player bundle that `include-in-header` loads (`dist/motion-canvas-ts.js`), so a missing script tag leaves the element inert, with no error.

## Option mechanics

Bare words (`fullscreen`) and `key=value` pairs are equivalent: a bare word is treated as `key="true"`. Any value other than the exact string `true` (or `false` for `loop`) is treated as off.

| Option | What the Lua emits | Notes |
| --- | --- | --- |
| `fullscreen` (or `=true`) | `style="position:absolute; top:0; width:100%; "` | Anything else, including `fullscreen=false`, is not fullscreen |
| `width="50%"` | See the warning below | Only considered when `fullscreen` is not set |
| `background` | adds `z-index: -1; ` to the style | Does not imply `fullscreen` |
| `loop=false` | `loop="false"` | The attribute is emitted only for `false`. There is no explicit `loop="true"`: absence means loop |
| `auto` (or `auto=true`) | `auto="true"` | Emitted only when true. `auto=false` and omitting `auto` produce identical HTML |

### `fullscreen` and `width` are mutually exclusive

The Lua builds the `width` output only when no fullscreen style has been set, so `fullscreen width="50%"` silently drops the width.

### `width` does not currently work

When it is not dropped, `width` is appended after the `style` attribute rather than inside it. The rendered HTML is `<canvas-commons-player src="..." style="" width:50%; >`, so the browser sees an attribute literally named `width:50%;` and ignores it. A non-fullscreen player therefore stays at the 75% width from the CSS the extension injects (`canvas-commons-player { width: 75%; }`). This was read from the rendered HTML, not measured in a browser. If you need a different width, add your own CSS rule for the element or fix the Lua so that the width goes inside `style`. Without `width`, non-fullscreen output also carries a stray empty `width:;` attribute, which is harmless.

### `background` is only a z-index

`background` adds `z-index: -1` and nothing else. On its own it gives a player that is 75% wide, sitting behind the slide text. To get a backdrop you must also pass `fullscreen`.

### `loop` and `auto` in the browser

`motion-canvas-player.js` runs on every slide change. It sets `auto="true"` on the player in the current slide whatever the attributes say, so omitting `auto` (or writing `auto=false`) does not stop the animation playing when you arrive at the slide. The same handler runs once when Reveal is ready, so the first slide behaves the same way. In this extension generation `auto` is effectively decorative. If `loop="false"` is set, the script watches the frame counter and parks the animation on its last frame. The script handles one player per slide, and it pauses the previous slide's player when you move on.

## Section divider recipe

```markdown
# Solutions

{{< motion-canvas ./animations/src/hexagons.js background fullscreen loop=false >}}
```

This is the form used in practice (once in the infosec deck). `fullscreen` stretches the player across the slide, `background` puts it behind the text, and `loop=false` plays the animation once then holds the final frame. The `#` heading stays visible on top of the animation, which is the point of a divider, so do not add `.hidetitle` here.

## Hiding the slide title

When the animation is the whole slide, hide the heading with `.hidetitle`:

```markdown
## Working with Infosec {.hidetitle autoslide=15000}

{{< motion-canvas ./animations/src/posit_footer.js auto fullscreen=true >}}
```

Quarto renders a heading for every slide, and a fullscreen player does not hide it. Without `.hidetitle` the title text shows beside or over the animation. Use it on title slides, end slides and full-slide animations, and leave it off dividers where you want the heading as a caption.

`.hidetitle` is a theme class, not a Quarto built-in. The Andrie house theme (`assets/andrie-slides.scss` in this skill) already defines it. With any other theme, such as the plain `default` theme or a project's own SCSS, add this to a `/*-- scss:rules --*/` block:

```scss
.hidetitle > h1, .hidetitle > h2 {
  display: none;
}
```

The Canvas Commons project template's `smoke.qmd` uses `.hidetitle` but loads no theme, so the class does nothing there until you add the rule.
