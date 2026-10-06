# Worked example: reviewing an IDE mockup scene

The scene is about 420 lines. It draws a Positron-style window with Python and R editor tabs, a console, a variables list, a plots panel, a status bar and three feature chips, and types code into the editor while switching from Python to R. The snippets below are illustrative and not importable: copy the idea into the scene or project you are reviewing. Everything in "Before and after" was built and rendered with Canvas Commons 0.4.0.

## Findings

Most valuable first. Line ranges are described by element, because line numbers go stale.

1. **Window chrome built from offset arithmetic.**
   - Where: the title bar, activity bar, tab strip, editor, console, side panel and status bar. Nearly every `position` is a sum of `top`, `left`, `cy`, `titleH`, `tabsH`, `consoleH` and `statusH`.
   - Signal: positions built from shared offsets.
   - Level: existing pattern. `motion-canvas-authoring/references/app-window-mockup.md` draws the same chrome as one flex layout with a palette object.
   - Saving: most of the offset maths (estimate: about a third of the scene).
   - Risk: pane sizes now reflow when the window size changes, so check the overlays that were positioned from the top-left.

2. **Feature chips edited by child index.**
   - Where: `showChips`, which does `(chip.children()[0] as Rect).fill(colour)` and `(chip.children()[1] as Txt).text(items[i])`, plus `pythonFeatures[i]` baked into the JSX.
   - Signal: children changed by index, and one state change needing several imperative calls.
   - Level: class component, `FeatureChip` with `label` and `accent` signals.
   - Saving: the casts and the per-chip setup in `showChips` (estimate: 10 to 15 lines).
   - Risk: the text and the dot colour now tween instead of snapping. If the snap was intended, call the signal with a value and no duration, for example `chip().label('Air formatter')`, which sets it immediately.

3. **Two near-identical editor tabs.**
   - Where: the two tab `Rect` nodes, their accent strips and their labels.
   - Signal: a block repeats with only strings or numbers changing.
   - Level: function component, `EditorTab`.
   - Saving: about 20 lines (estimate).
   - Risk: a behaviour change worth checking first. The Python tab's accent strip is a plain `Rect` with no opacity binding, while the R strip follows `rTabActive().opacity()`, and step 3 fades only the tab background. After the switch to R both strips are likely visible. Building the strip as a child of the tab fixes this by construction. The animation code still needs refs to the active strip and the label fills, so `EditorTab` takes a `ref` for the tab `Rect`.

4. **Two variables lists repeating five `Txt` nodes.**
   - Where: `varsPy` and `varsR`.
   - Signal: a block repeats with only strings or numbers changing.
   - Level: plain helper, `VarRow(name, type)`, inside a column layout.
   - Saving: about 15 lines (estimate).
   - Risk: none.

5. **Three small panel labels** (`CONSOLE`, `VARIABLES`, `PLOTS`).
   - Level: plain helper, but borderline. Three uses is the threshold, so extract only if the file is being tidied anyway.

6. **Session switch driven by separate calls.**
   - Where: step 3 of the timeline, which sets `sessionTxt`, `statusLang`, `statusTools`, `dot`, both tab fills and the tab opacities one call at a time.
   - Signal: one state change needing several imperative calls.
   - Level: class component, a `session` signal on a window class.
   - Risk: a larger change than the others. Do it only if a second scene reuses the window, otherwise leave it inline.

7. **Palettes, highlighters and `typeCode` in the scene.**
   - Level: move to a project module when a second scene needs them. Not before.

8. **Plot bars and line numbers.** Already loops. Leave inline.

## Before and after

### FeatureChip (class component)

Before, in `showChips`:

```tsx
for (let i = 0; i < 3; i++) {
  const chip = chips[i];
  (chip.children()[0] as Rect).fill(colour);
  (chip.children()[1] as Txt).text(items[i]);
  chip.position.y(chip.position.y() + 20);
}
```

After: `label` and `accent` are signals, so the dot and the text follow them, and a switch from Python to R is one tween.

```tsx
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

// in the timeline
yield* all(
  chip().label('Air formatter', 0.4),
  chip().accent(Posit.teal, 0.4, easeOutCubic),
);
```

### EditorTab (function component)

Before: each tab was a `Rect` for the background, a `Rect` for the accent strip and a `Txt`, each with its own hand-computed `position`.

After: a function taking a props object. The `ref` arrives as a prop, so the timeline can still tween the tab. The snippet leaves out the accent strip for brevity: add it as a child `Rect` with `opacity={active ? 1 : 0}`.

```tsx
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

<Layout layout direction="row">
  <EditorTab label="analysis.py" active />
  <EditorTab label="analysis.R" />
</Layout>
```

### VarRow (plain helper)

Before: five `Txt` nodes per list, each with `anchor`, `position` and the same font props.

After: one row per call, laid out by flex.

```tsx
function VarRow(name: string, type: string) {
  return (
    <Layout layout direction="row" gap={40}>
      <Txt text={name} fontFamily={MONO} fontSize={22} fill="#9CDCFE" width={70} />
      <Txt text={type} fontFamily={MONO} fontSize={22} fill={App.fg} />
    </Layout>
  );
}

<Layout layout direction="column" gap={8}>
  {VarRow('df', 'DataFrame (344 x 8)')}
  {VarRow('pd', 'module')}
</Layout>
```

## Gotchas found while building

- The snippets built and type-checked (`tsc --noEmit` in `animations/`) unchanged, and the rendered slide showed the initial chip ("Pyrefly language server", blue dot) and then the tweened one ("Air formatter", teal dot).
- `ref` is accepted as a prop on a function component, so `EditorTab` needs no special handling for it.
- When screenshotting a tween that starts at the beginning of a scene, the first frames may already show the end state because of player start latency. Put a `waitFor(...)` before the tween while checking, and remove it afterwards.
