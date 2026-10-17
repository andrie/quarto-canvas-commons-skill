import {Circle, Line, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createRefArray, waitFor} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {MONO, MUTED, PANEL, Posit, UI} from '../styles';

type Kind = 'file' | 'step';

interface NodeSpec {
  label: string;
  detail: string;
  kind: Kind;
  col: number;
  row: number;
}

// The build pipeline from source to the web, as data: boxes first, then the arrows between them
const nodes: NodeSpec[] = [
  {label: 'Scene', detail: 'animations/src/scenes', kind: 'file', col: 0, row: 0},
  {label: 'make anim', detail: 'tsc, then vite', kind: 'step', col: 1, row: 0},
  {label: 'dist/', detail: 'one .js per scene', kind: 'file', col: 2, row: 0},
  {label: 'Deck', detail: 'animation-as-code.qmd', kind: 'file', col: 0, row: 1},
  {label: 'quarto render', detail: 'runs the shortcode', kind: 'step', col: 1, row: 1},
  {label: 'Rendered deck', detail: 'HTML that loads dist/', kind: 'file', col: 2, row: 1},
  {label: 'Connect Cloud', detail: 'quarto publish', kind: 'file', col: 3, row: 1},
];

// [from, to] indices into nodes, in the order they are drawn
const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [2, 5],
  [5, 6],
];

// The route the dot takes at the end
const route = [0, 1, 2, 5, 6];

const BOX_W = 330;
const BOX_H = 130;
const nodeX = (col: number) => (col - 1.5) * 470;
const nodeY = (row: number) => -140 + row * 270;

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const boxes = createRefArray<Rect>();
  const arrows = createRefArray<Line>();
  const dot = createRef<Circle>();

  // Horizontal arrows join right edge to left edge, vertical ones bottom to top
  const anchorPoints = ([from, to]: [number, number]) =>
    nodes[from].row === nodes[to].row
      ? [() => boxes[from].right(), () => boxes[to].left()]
      : [() => boxes[from].bottom(), () => boxes[to].top()];

  view.add(
    <>
      {Title('Boxes and arrows make a diagram', title)}

      {nodes.map(node => (
        <Rect
          ref={boxes}
          layout
          direction="column"
          alignItems="center"
          justifyContent="center"
          gap={6}
          position={[nodeX(node.col), nodeY(node.row)]}
          size={[BOX_W, BOX_H]}
          radius={node.kind === 'step' ? 65 : 14}
          fill={node.kind === 'step' ? Posit.orange : PANEL}
          stroke={node.kind === 'step' ? Posit.orange : Posit.blue}
          lineWidth={5}
          opacity={0}
        >
          <Txt text={node.label} fontFamily={node.kind === 'step' ? MONO : UI} fontSize={36} fontWeight={700} fill="#FFFFFF" />
          <Txt text={node.detail} fontFamily={UI} fontSize={22} fill={node.kind === 'step' ? '#FFFFFF' : MUTED} />
        </Rect>
      ))}

      {edges.map(edge => (
        <Line ref={arrows} points={anchorPoints(edge)} stroke={MUTED} lineWidth={5} endArrow arrowSize={18} end={0} />
      ))}

      <Circle ref={dot} size={34} fill={Posit.teal} opacity={0} />

      {PromptBar(bar, words, 'draw the build pipeline as boxes joined by arrows')}
    </>,
  );

  yield* title().opacity(1, 0.5);
  yield* bar().opacity(1, 0.5);
  yield* waitFor(0.5);

  // Draw each arrow, showing its boxes as it reaches them
  const shown = new Set<number>();
  function* reveal(index: number) {
    if (!shown.has(index)) {
      shown.add(index);
      yield* boxes[index].opacity(1, 0.4);
    }
  }
  for (let i = 0; i < edges.length; i++) {
    const [from, to] = edges[i];
    yield* reveal(from);
    yield* arrows[i].end(1, 0.5);
    yield* reveal(to);
  }
  yield* waitFor(1.5);

  // Send a dot along the route
  yield* swapText(words(), 'follow one scene from the source to the web');
  dot().position(boxes[route[0]].position());
  yield* dot().opacity(1, 0.3);
  for (const index of route.slice(1)) {
    yield* all(dot().position(boxes[index].position(), 0.9), boxes[index].scale(1.06, 0.45).to(1, 0.45));
  }
  yield* dot().opacity(0, 0.4);
  yield* waitFor(2);
});
