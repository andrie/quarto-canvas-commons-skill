import {Circle, Layout, Line, Node, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {
  TimingFunction,
  all,
  createRef,
  createRefArray,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutBounce,
  easeOutCubic,
  linear,
  waitFor,
} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {BORDER, MONO, MUTED, Posit, UI} from '../styles';

interface LaneSpec {
  name: string;
  words: string;
  colour: string;
  curve: TimingFunction;
}

// One lane per easing curve: the name Claude knows it by, and how to say it in plain words
const lanes: LaneSpec[] = [
  {name: 'linear', words: 'at a constant speed', colour: Posit.blue, curve: linear},
  {name: 'easeInOutCubic', words: 'start and stop gently (the default)', colour: Posit.teal, curve: easeInOutCubic},
  {name: 'easeInCubic', words: 'start slowly, then speed up', colour: Posit.green, curve: easeInCubic},
  {name: 'easeOutCubic', words: 'start fast, then slow down', colour: Posit.orange, curve: easeOutCubic},
  {name: 'easeOutBack', words: 'overshoot, then settle', colour: Posit.burgundy, curve: easeOutBack},
  {name: 'easeOutBounce', words: 'bounce at the end', colour: '#FFFFFF', curve: easeOutBounce},
];

const START = -180;
const END = 700;
const laneY = (i: number) => -270 + i * 100;

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const balls = createRefArray<Circle>();

  view.add(
    <>
      {Title('How it moves is a choice too', title)}

      {lanes.map((lane, i) => (
        <Node>
          <Layout layout direction="column" gap={2} position={[-880, laneY(i)]} anchor={[-1, 0]}>
            <Txt text={lane.name} fontFamily={MONO} fontSize={28} fill={Posit.orange} />
            <Txt text={lane.words} fontFamily={UI} fontSize={22} fill={MUTED} />
          </Layout>
          <Line points={[[START, laneY(i)], [END, laneY(i)]]} stroke={BORDER} lineWidth={4} lineDash={[12, 12]} />
          <Circle ref={balls} size={52} x={START} y={laneY(i)} fill={lane.colour} />
        </Node>
      ))}

      {PromptBar(bar, words, 'race six balls across the screen, each with its own curve')}
    </>,
  );

  yield* title().opacity(1, 0.5);
  yield* bar().opacity(1, 0.5);
  yield* waitFor(1);

  for (let round = 0; round < 3; round++) {
    yield* all(...balls.map((ball, i) => ball.x(END, 2.4, lanes[i].curve)));
    yield* waitFor(0.8);
    yield* all(...balls.map(ball => ball.x(START, 0.6)));
    yield* waitFor(0.3);
  }
  yield* swapText(words(), 'make the last one bounce when it arrives');
  yield* waitFor(2.5);
});
