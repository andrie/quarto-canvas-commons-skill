import {Code, Rect, Txt, lines, makeScene2D} from '@canvas-commons/2d';
import {DEFAULT, all, createRef, waitFor} from '@canvas-commons/core';
import {pythonHighlighter, rHighlighter} from '../components/highlighters';
import {PromptBar, Title, swapText} from '../components/stage';
import {MONO, MUTED, PANEL, UI} from '../styles';

const rLines = [
  'library(palmerpenguins)',
  'adelie <- subset(penguins, species == "Adelie")',
  'avg <- mean(adelie$body_mass_g, na.rm = TRUE)',
  'round(avg)',
];

const pythonLines = [
  'from palmerpenguins import load_penguins',
  'penguins = load_penguins()',
  'adelie = penguins[penguins["species"] == "Adelie"]',
  'round(adelie["body_mass_g"].mean())',
];

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const fileName = createRef<Txt>();
  const rCode = createRef<Code>();
  const pyCode = createRef<Code>();

  const CODE_FONT = {fontFamily: MONO, fontSize: 36, anchor: [-1, -1] as [number, number], position: [-600, -130] as [number, number]};

  view.add(
    <>
      {Title('Code can type itself in, and change in front of you', title)}

      <Rect position={[0, -20]} size={[1300, 520]} radius={16} fill={PANEL} stroke={MUTED} lineWidth={3}>
        <Txt ref={fileName} text="analysis.R" position={[-630, -225]} anchor={[-1, 0]} fontFamily={UI} fontSize={28} fill={MUTED} />
        <Code ref={rCode} highlighter={rHighlighter} code="" {...CODE_FONT} />
        <Code ref={pyCode} highlighter={pythonHighlighter} code="" opacity={0} {...CODE_FONT} />
      </Rect>

      {PromptBar(bar, words, 'type out four lines of R, one at a time')}
    </>,
  );

  // Add a line at a time, so the code appears to be typed
  function* typeLines(node: Code, text: string[]) {
    for (let i = 1; i <= text.length; i++) {
      yield* node.code(text.slice(0, i).join('\n'), 0.7);
      yield* waitFor(0.25);
    }
  }

  yield* title().opacity(1, 0.5);
  yield* bar().opacity(1, 0.5);
  yield* waitFor(0.5);

  yield* typeLines(rCode(), rLines);
  yield* waitFor(1);

  // Highlight a line: the others dim
  yield* swapText(words(), 'highlight the line that picks out one species');
  yield* rCode().selection(lines(1), 0.6);
  yield* waitFor(1.8);
  yield* rCode().selection(DEFAULT, 0.6);

  // Change a word, and the code morphs
  yield* swapText(words(), 'change Adelie to Gentoo');
  const gentoo = rLines.map(line => line.replace('Adelie', 'Gentoo').replace('adelie', 'gentoo'));
  yield* rCode().code(gentoo.join('\n'), 1.2);
  yield* waitFor(1.8);

  // The same thing in Python, in the same box
  yield* swapText(words(), 'now show the same steps in Python');
  yield* all(rCode().opacity(0, 0.5), swapText(fileName(), 'analysis.py'));
  yield* pyCode().opacity(1, 0.1);
  yield* typeLines(pyCode(), pythonLines);
  yield* waitFor(3);
});

