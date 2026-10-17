import {Circle, Code, Latex, Line, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createRefArray, waitFor} from '@canvas-commons/core';
import {rHighlighter} from '../components/highlighters';
import {PromptBar, Title, swapText} from '../components/stage';
import {MONO, MUTED, PANEL, Posit, UI} from '../styles';

interface TileSpec {
  label: string;
  node: string;
  prompt: string;
  content: () => Node;
}

// What you can draw, as data: each tile names the node and the sentence that asks for it
const tiles: TileSpec[] = [
  {
    label: 'Box',
    node: 'Rect',
    prompt: 'draw a rounded blue box',
    content: () => <Rect size={[170, 110]} radius={22} fill={Posit.blue} />,
  },
  {
    label: 'Circle',
    node: 'Circle',
    prompt: 'add an orange circle',
    content: () => <Circle size={130} fill={Posit.orange} />,
  },
  {
    label: 'Arrow',
    node: 'Line',
    prompt: 'draw an arrow pointing up and to the right',
    content: () => <Line points={[[-70, 45], [70, -45]]} stroke={Posit.teal} lineWidth={10} endArrow arrowSize={26} />,
  },
  {
    label: 'Text',
    node: 'Txt',
    prompt: 'write the word Hello',
    content: () => <Txt text="Hello" fontFamily={UI} fontSize={70} fontWeight={700} fill="#FFFFFF" />,
  },
  {
    label: 'Code',
    node: 'Code',
    prompt: 'show two lines of R code',
    content: () => <Code highlighter={rHighlighter} code={'x <- c(2, 4, 6)\nmean(x)'} fontSize={24} fontFamily={MONO} />,
  },
  {
    label: 'Maths',
    node: 'Latex',
    prompt: 'show the formula for the mean',
    content: () => <Latex tex="{\color{white}\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i}" width={220} />,
  },
];

const TILE = 260;
const GAP = 30;
const tileX = (i: number) => (i - (tiles.length - 1) / 2) * (TILE + GAP);

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const frames = createRefArray<Node>();

  view.add(
    <>
      {Title('Things you can put on a slide', title)}

      {tiles.map((tile, i) => (
        <Node ref={frames} position={[tileX(i), -40]} opacity={0}>
          <Rect size={[TILE, TILE]} radius={18} fill={PANEL} stroke={MUTED} lineWidth={3}>
            {tile.content()}
          </Rect>
          <Txt text={tile.label} y={185} fontFamily={UI} fontSize={34} fontWeight={700} fill="#FFFFFF" />
          <Txt text={tile.node} y={230} fontFamily={MONO} fontSize={24} fill={Posit.orange} />
        </Node>
      ))}

      {PromptBar(bar, words, tiles[0].prompt)}
    </>,
  );

  yield* title().opacity(1, 0.5);
  yield* bar().opacity(1, 0.5);

  for (let i = 0; i < tiles.length; i++) {
    yield* all(
      swapText(words(), tiles[i].prompt),
      frames[i].opacity(1, 0.5),
      frames[i].scale(0.8, 0).to(1, 0.5),
    );
    yield* waitFor(1.6);
  }
  yield* waitFor(2);
});
