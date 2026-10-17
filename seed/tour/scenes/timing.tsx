import {Layout, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  ThreadGenerator,
  all,
  chain,
  createRef,
  createRefArray,
  easeOutBack,
  sequence,
  waitFor,
} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {MONO, MUTED, Posit, UI} from '../styles';

interface RowSpec {
  name: string;
  words: string;
  prompt: string;
  colour: string;
  // Pop the boxes in, in the order and rhythm this row is about
  play: (boxes: Rect[]) => ThreadGenerator;
}

const pop = (box: Rect) => box.scale(1, 0.5, easeOutBack);

const rows: RowSpec[] = [
  {
    name: 'chain',
    words: 'one after another',
    prompt: 'show the boxes one after another',
    colour: Posit.blue,
    play: boxes => chain(...boxes.map(pop)),
  },
  {
    name: 'all',
    words: 'all at once',
    prompt: 'show all the boxes at the same time',
    colour: Posit.orange,
    play: boxes => all(...boxes.map(pop)),
  },
  {
    name: 'sequence',
    words: 'staggered',
    prompt: 'show the boxes with a short delay between each',
    colour: Posit.teal,
    play: boxes => sequence(0.2, ...boxes.map(pop)),
  },
];

const COUNT = 5;
const rowY = (i: number) => -190 + i * 190;
const boxX = (k: number) => -120 + k * 150;

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const labels = createRefArray<Layout>();
  const grid = rows.map(() => createRefArray<Rect>());

  view.add(
    <>
      {Title('Order and rhythm are part of the description', title)}

      {rows.map((row, i) => (
        <Node>
          <Layout ref={labels} layout direction="column" gap={2} position={[-880, rowY(i)]} anchor={[-1, 0]} opacity={0.5}>
            <Txt text={row.name} fontFamily={MONO} fontSize={34} fill={row.colour} />
            <Txt text={row.words} fontFamily={UI} fontSize={26} fill={MUTED} />
          </Layout>
          {Array.from({length: COUNT}, (_, k) => (
            <Rect ref={grid[i]} position={[boxX(k), rowY(i)]} size={100} radius={14} fill={row.colour} scale={0} />
          ))}
        </Node>
      ))}

      {PromptBar(bar, words, rows[0].prompt)}
    </>,
  );

  const reset = () => all(...grid.flatMap(boxes => boxes.map(box => box.scale(0, 0.3))));

  yield* title().opacity(1, 0.5);
  yield* bar().opacity(1, 0.5);
  yield* waitFor(0.5);

  // One row at a time
  for (let i = 0; i < rows.length; i++) {
    yield* all(swapText(words(), rows[i].prompt), labels[i].opacity(1, 0.3));
    yield* rows[i].play(grid[i]);
    yield* waitFor(0.8);
  }

  // Then all three together, so the rhythms can be compared
  yield* all(reset(), swapText(words(), 'now start all three at once'));
  yield* waitFor(0.4);
  yield* all(...rows.map((row, i) => row.play(grid[i])));
  yield* waitFor(2.5);
});
