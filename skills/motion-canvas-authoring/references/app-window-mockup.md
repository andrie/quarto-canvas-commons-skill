# Mocking up an application window

Use this when a scene shows a desktop application, such as an IDE with an editor, a console and a status bar, and the window itself is drawn rather than captured. The pattern has three parts: a palette object holding the application's colours, a helper that builds the window chrome as one flex layout, and absolute positions only for the few overlays that must not reflow.

Everything below was built and rendered with Canvas Commons 0.4.0, and the geometry rules were checked against markers in a screenshot.

## Colour tokens

Define one object with the colours of the application you are imitating, and use only its names in the scene. Swapping the theme, or matching a newer release of the application, is then a one-place edit.

For a real application, copy the values from its theme file rather than picking them by eye. Applications built on VS Code ship their themes as JSON: the `colors` object holds the chrome (`editor.background`, `titleBar.activeBackground`, `activityBar.background`, `tab.activeBackground`, `panel.background`, `statusBar.background` and so on) and `tokenColors` holds the syntax colours. A theme can `include` another file and override only some keys, so follow the `include` chain for any key it does not set. Positron's dark theme is `resources/app/extensions/theme-defaults/themes/positron_dark.json` inside the application's install directory: that path came from a field report and matched a Windows install of Positron, where the file includes `./dark_modern.json` and overrides some keys, such as the activity bar colours.

## The window helper

The chrome is one `Rect` with `layout`, so the title bar, activity bar, tab strip, panes and status bar size themselves: fixed heights and widths for the bars, `grow={1}` for whatever fills the rest. There is no pixel arithmetic, and changing the window size reflows everything. `clip` with `radius` rounds the corners of the children too. The helper hands back refs to the empty editor and console panes, so the scene fills them later.

```tsx
import {Code, Layout, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitFor, type Reference} from '@canvas-commons/core';

// Colour tokens for the application being imitated (here: a generic dark IDE).
const App = {
  chrome: '#181818', // title bar, tab strip, side panels
  editor: '#1F1F1F', // editor background
  border: '#2B2B2B',
  accent: '#2F4A60', // activity bar and status bar
  accentFg: '#C1D6E8',
  fg: '#CCCCCC',
  muted: '#6E7681',
};
const UI = 'system-ui, sans-serif';
const MONO = 'monospace';

interface AppWindowProps {
  width: number;
  height: number;
  title: string;
  tabs: string[];
  editor: Reference<Layout>;
  console: Reference<Layout>;
  status: Reference<Txt>;
}

// Window chrome as one flex layout: no pixel maths, the panes size themselves.
function AppWindow({width, height, title, tabs, editor, console, status}: AppWindowProps) {
  const label = {fontFamily: UI, fill: App.fg};
  return (
    <Rect layout direction="column" size={[width, height]} fill={App.editor}
          radius={10} stroke={App.border} lineWidth={2} clip>
      <Rect height={38} fill={App.chrome} justifyContent="center" alignItems="center">
        <Txt {...label} fontSize={18} text={title} />
      </Rect>
      <Layout grow={1} direction="row">
        <Rect width={64} fill={App.accent} direction="column" alignItems="center" paddingTop={24} gap={36}>
          {[0, 1, 2, 3].map(i => <Rect size={28} radius={6} stroke={App.accentFg} lineWidth={3} opacity={i === 0 ? 1 : 0.6} />)}
        </Rect>
        <Layout grow={1} direction="column">
          <Rect height={44} fill={App.chrome}>
            {tabs.map((t, i) => (
              <Rect width={220} fill={i === 0 ? App.editor : App.chrome} justifyContent="center" alignItems="center">
                <Txt {...label} fontSize={20} fill={i === 0 ? '#FFFFFF' : App.muted} text={t} />
              </Rect>
            ))}
          </Rect>
          <Layout ref={editor} grow={1} padding={24} direction="column" />
          <Rect height={260} fill={App.chrome} stroke={App.border} lineWidth={2} padding={20} direction="column" gap={12}>
            <Txt {...label} fontSize={16} fill={App.muted} text="CONSOLE" />
            <Layout ref={console} direction="column" />
          </Rect>
        </Layout>
      </Layout>
      <Rect height={32} fill={App.accent} alignItems="center" paddingLeft={20}>
        <Txt ref={status} {...label} fontSize={18} fill={App.accentFg} text="Ready" />
      </Rect>
    </Rect>
  );
}
```

## Using it in a scene

Pass refs in, add the window, then add content to the panes. Preformatted output, such as a console, belongs in a `Code` node with `highlighter={null}`, which keeps its spaces (see the `motion-canvas-api` skill's "Plain text and line spacing"); for coloured R or Python code, use the `motion-canvas-r-code` skill's highlighters instead of `null`.

```tsx
export default makeScene2D(function* (view) {
  view.fill('#000000');
  const editor = createRef<Layout>();
  const consolePane = createRef<Layout>();
  const status = createRef<Txt>();
  const code = createRef<Code>();
  const out = createRef<Code>();
  const toast = createRef<Rect>();

  const W = 1760, H = 880;
  view.add(
    <Layout y={-50}>
      <AppWindow width={W} height={H} title="analysis - My IDE" tabs={['analysis.py', 'notes.md']}
                 editor={editor} console={consolePane} status={status} />
      {/* An overlay outside the flex layout, positioned from the window's top-left: (1100, 120), size 480 x 52 */}
      <Rect ref={toast} position={[1100 + 480 / 2 - W / 2, 120 + 52 / 2 - H / 2]} size={[480, 52]}
            fill="#313131" stroke={App.accentFg} lineWidth={2} radius={6} opacity={0}>
        <Txt fontFamily={UI} fontSize={22} fill={App.fg} text="Formatter finished" />
      </Rect>
    </Layout>,
  );
  editor().add(<Code ref={code} highlighter={null} fontFamily={MONO} fontSize={26} lineHeight={36} fill={App.fg} code="" />);
  consolePane().add(<Code ref={out} highlighter={null} fontFamily={MONO} fontSize={22} lineHeight={32} fill={App.fg} code="" />);

  yield* code().code('x = [1, 2, 3]\nsum(x)', 0.8);
  yield* all(out().code('>>> sum(x)\n6', 0.6), status().text('Running', 0.3));
  yield* toast().opacity(1, 0.4);
  yield* waitFor(2);
});
```

## Positions are relative to the group's centre

Anything that sits outside the flex layout, like the toast above, is placed by `position`, which is relative to its parent's origin. For a `Layout` group or a `Rect`, that origin is the centre, not the top-left corner. It stays the centre even when the parent has `anchor={[-1, -1]}`: `anchor` moves the parent itself, not where its children are drawn. Working in top-left pixel coordinates, as a mockup naturally does, is where the arithmetic goes wrong.

For a box whose top-left corner is at `(x, y)` from the top-left of a `W` by `H` group, with size `w` by `h`:

```tsx
// Default anchor (the box's centre): add half the box, subtract half the group
<Rect position={[x + w / 2 - W / 2, y + h / 2 - H / 2]} size={[w, h]} />
// Or anchor the box at its own top-left and subtract half the group only
<Rect anchor={[-1, -1]} position={[x - W / 2, y - H / 2]} size={[w, h]} />
```

Both put the corner in the same place. The window and the overlay must share a parent of the same size, as the `<Layout y={-50}>` wrapper does above: if the window moves, so does the overlay. In view coordinates, add the group's own position (here `y = -50`).

Inside the flex layout the layout positions each child, so keep anything that has to move freely, such as a cursor, a highlight or a toast, outside the flex tree.

## Check how it looks

A mockup is only right if it looks like the application. Render the deck and take screenshots of the slide with the `motion-canvas-scene` skill's `scripts/screenshot-slide.mjs` (its `references/validate.md`, "Check the scene visually"), then compare them with a real screenshot of the application.
