import {Img, Layout, Rect, SVG, Shape, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createRefArray, sequence, waitFor} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {BORDER, MONO, Posit} from '../styles';
import positLogo from '../assets/Posit.svg';
import positDarkLogo from '../assets/Posit-dark.svg';
import positDarkRaw from '../assets/Posit-dark.svg?raw';
import positronDark from '../assets/Positron-dark.svg';
import connectDark from '../assets/Posit-Connect-dark.svg';
import workbenchDark from '../assets/Posit-Workbench-dark.svg';
import packageManagerDark from '../assets/Posit-Package-Manager-dark.svg';

const LIGHT = '#FFFFFF';
const DARK = '#17212B';

// The product logos shown in the line-up, in the dark-mode version
const products = [positDarkLogo, positronDark, connectDark, workbenchDark, packageManagerDark];

// The logo files colour their paths with CSS classes. Replace each class with a fill attribute, so the SVG node sees the colours.
function inlineFills(svg: string) {
  const fills = new Map<string, string>();
  for (const [, cls, colour] of svg.matchAll(/\.(cls-\d+)\{fill:(#[0-9a-f]+);\}/gi)) fills.set(cls, colour);
  return svg.replace(/class="(cls-\d+)"/g, (match, cls) => (fills.has(cls) ? `fill="${fills.get(cls)}"` : match));
}

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const panel = createRef<Rect>();
  const panelColour = createRef<Img>();
  const panelDark = createRef<Img>();
  const panelLabel = createRef<Txt>();
  const sidePanel = createRef<Rect>();
  const sideLabel = createRef<Txt>();
  const lineUp = createRef<Layout>();
  const productImgs = createRefArray<Img>();
  const letters = createRef<SVG>();

  view.add(
    <>
      {Title('Logos are SVG files, so they can change too', title)}

      <Rect ref={panel} position={[-420, -40]} size={[760, 380]} radius={20} fill={LIGHT} opacity={0}>
        <Img ref={panelColour} src={positLogo} width={520} />
        <Img ref={panelDark} src={positDarkLogo} width={520} opacity={0} />
        <SVG ref={letters} svg={inlineFills(positDarkRaw)} width={620} opacity={0} />
        <Layout ref={lineUp} layout gap={64} alignItems="center" opacity={0}>
          {products.map(src => (
            <Img ref={productImgs} src={src} height={70} opacity={0} />
          ))}
        </Layout>
      </Rect>
      <Txt ref={panelLabel} text="Posit.svg" position={[-420, 195]} fontFamily={MONO} fontSize={30} fill={Posit.orange} opacity={0} />

      <Rect ref={sidePanel} position={[420, -40]} size={[760, 380]} radius={20} fill={DARK} stroke={BORDER} lineWidth={3} opacity={0}>
        <Img src={positDarkLogo} width={520} />
      </Rect>
      <Txt ref={sideLabel} text="Posit-dark.svg" position={[420, 195]} fontFamily={MONO} fontSize={30} fill={Posit.orange} opacity={0} />

      {PromptBar(bar, words, 'show the Posit logo for a light and a dark background')}
    </>,
  );

  yield* title().opacity(1, 0.5);
  yield* all(bar().opacity(1, 0.5), panel().opacity(1, 0.8), sidePanel().opacity(1, 0.8), panelLabel().opacity(1, 0.8), sideLabel().opacity(1, 0.8));
  yield* waitFor(2.5);

  // One panel switches between light and dark mode
  yield* swapText(words(), 'fade from light mode to dark mode');
  yield* all(
    sidePanel().opacity(0, 0.6),
    sideLabel().opacity(0, 0.6),
    panel().position.x(0, 1),
    panelLabel().position.x(0, 1),
  );
  yield* waitFor(0.5);
  for (let i = 0; i < 2; i++) {
    yield* all(
      panel().fill(DARK, 1),
      panelColour().opacity(0, 1),
      panelDark().opacity(1, 1),
      swapText(panelLabel(), 'Posit-dark.svg'),
    );
    yield* waitFor(0.8);
    if (i === 0) {
      yield* all(
        panel().fill(LIGHT, 1),
        panelColour().opacity(1, 1),
        panelDark().opacity(0, 1),
        swapText(panelLabel(), 'Posit.svg'),
      );
      yield* waitFor(0.8);
    }
  }

  // Many logos, one after another
  yield* swapText(words(), 'line up the product logos, one after another');
  yield* all(
    panel().size([1700, 300], 1),
    panelDark().opacity(0, 0.6),
    panelLabel().position.y(195, 1),
    lineUp().opacity(1, 0.8),
    swapText(panelLabel(), 'one colour file and one dark file for each product'),
  );
  yield* sequence(0.35, ...productImgs.map(img => img.opacity(1, 0.5)));
  yield* waitFor(2);

  // Paths inside one logo
  yield* swapText(words(), 'light up each part of the logo in turn');
  yield* all(
    lineUp().opacity(0, 0.6),
    panel().size([900, 380], 1),
    letters().opacity(1, 0.8),
    swapText(panelLabel(), 'every part of the logo is its own path'),
  );
  const paths = letters().wrapper.children() as Shape[];
  yield* waitFor(0.5);
  for (let lap = 0; lap < 2; lap++) {
    yield* sequence(0.3, ...paths.map(path => path.fill(Posit.teal, 0.3).to(path.fill(), 0.3)));
    yield* waitFor(0.4);
  }
  yield* waitFor(2);
});
