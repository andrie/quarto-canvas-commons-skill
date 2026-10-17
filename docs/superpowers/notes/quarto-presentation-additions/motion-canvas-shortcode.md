# The canvas-commons shortcode: option mechanics

Use `{{< canvas-commons ./animations/src/NAME.js background fullscreen loop=false >}}` for a section-divider background, and `{{< canvas-commons ./animations/src/NAME.js fullscreen >}}` for a full-slide animation. Everything below explains why, so you can pick options without guessing.

This file describes the `canvas-commons` extension, version 0.4.0 or later, from <https://github.com/andrie/quarto-canvas-commons> (`quarto add andrie/quarto-canvas-commons`). Before 0.4.0 the extension was called `motion-canvas` and its shortcode was `{{< motion-canvas >}}`. The old shortcode still works and prints a warning once per render. Older copies also differed in behaviour: `width=` never applied, and a deck needed an `include-in-header` script tag.

## Paths and the player element

The shortcode's first argument is the path to the built animation, and it is `./animations/src/<name>.js`. The build writes the file to `dist/animations/src/<name>.js`, and the extension's player bundle resolves the shortcode path against the project's `dist/` folder, so the `dist/` prefix is not written in the shortcode. In a website, the extension writes a `canvas-commons:offset` meta tag with the distance from the page to the project root, so a deck in a subdirectory finds `dist/` too.

The shortcode emits a `<canvas-commons-player>` custom element. The player bundle (`canvas-commons-bundle.js`) that defines it ships in the extension, and the shortcode adds it to the page, so the deck needs no `include-in-header` entry. A project from an older template that still loads `dist/motion-canvas-ts.js` that way defines the element twice, and the second definition throws.

## Option mechanics

Bare words (`fullscreen`) and `key=value` pairs are equivalent: a bare word is treated as `key=true`. Any value other than the exact string `true` (or `false` for `loop` and `auto`) is treated as off.

| Option | What the Lua emits | Notes |
| --- | --- | --- |
| `fullscreen` (or `=true`) | `style="position:absolute; top:0; width:100%;"` | Anything else, including `fullscreen=false`, is not fullscreen |
| `width=50%` | `style="width:50%;"` | Ignored when `fullscreen` is set |
| `background` | adds `z-index:-1;` to the style | Does not imply `fullscreen` |
| `loop=false` | `loop="false"` | Emitted only for `false`. Absence means loop |
| `auto=false` | `auto="false"` | Stops the animation starting when its slide is shown. A bare `auto` or `auto=true` emits `auto="true"`, which is the default behaviour anyway |

The player gets one `style` attribute, or none when no option needs it. Without `width`, a non-fullscreen player stays at the 75% width from the CSS the extension injects (`canvas-commons-player { width: 75%; }`).

### `fullscreen` and `width` are mutually exclusive

`fullscreen width=50%` drops the width: a fullscreen player fills the slide.

### `background` is only a z-index

`background` adds `z-index:-1` and nothing else. On its own it gives a player that is 75% wide, sitting behind the slide text. To get a backdrop you must also pass `fullscreen`.

### `loop` and `auto` in the browser

`canvas-commons-slides.js` runs on every slide change. Unless the shortcode said `auto=false`, it starts the player in the current slide when you arrive. The same handler runs once when Reveal is ready, so the first slide behaves the same way. If `loop="false"` is set, the script watches the frame counter and parks the animation on its last frame. The script handles one player per slide, and on each slide change it calls `togglePlayback(false)` on the previous slide's player, which pauses it. (Earlier copies called `togglePlayback()` with no argument. That flips the play state, so a finished `loop=false` scene was restarted when you left its slide.) The call uses `player?.`, so a player that never loaded does not throw.

## Section divider recipe

```markdown
# Solutions

{{< canvas-commons ./animations/src/hexagons.js background fullscreen loop=false >}}
```

This is the form used in practice (once in the infosec deck). `fullscreen` stretches the player across the slide, `background` puts it behind the text, and `loop=false` plays the animation once then holds the final frame. The `#` heading stays visible on top of the animation, which is the point of a divider, so do not add `.hidetitle` here.

## Hiding the slide title

When the animation is the whole slide, hide the heading with `.hidetitle`:

```markdown
## Working with Infosec {.hidetitle autoslide=15000}

{{< canvas-commons ./animations/src/posit_footer.js fullscreen=true >}}
```

Quarto renders a heading for every slide, and a fullscreen player does not hide it. Without `.hidetitle` the title text shows beside or over the animation. Use it on title slides, end slides and full-slide animations, and leave it off dividers where you want the heading as a caption.

`.hidetitle` is a theme class, not a Quarto built-in. The Andrie house theme (`assets/andrie-slides.scss` in this skill) already defines it. With any other theme, such as the plain `default` theme or a project's own SCSS, add this to a `/*-- scss:rules --*/` block:

```scss
.hidetitle > h1, .hidetitle > h2 {
  display: none;
}
```

The deck the Canvas Commons project template creates (the template's `deck.qmd`, renamed to the user's deck name at bootstrap) uses `.hidetitle` on its smoke slide but loads no theme, so the class does nothing there until you add the rule.
