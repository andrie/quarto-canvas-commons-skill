import {Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {ThreadGenerator, all, createRef, createRefArray, waitFor} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {CLEAR, MONO, MUTED, Posit} from '../styles';

// The properties you can change over time, in the order the scene shows them
const properties = ['position', 'size', 'opacity', 'fill', 'rotation', 'radius'];

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const box = createRef<Rect>();
  const chips = createRefArray<Rect>();

  view.add(
    <>
      {Title('Anything on screen can change over time', title)}

      <Rect layout gap={20} position={[0, -300]}>
        {properties.map(name => (
          <Rect ref={chips} layout padding={[10, 26]} radius={24} stroke={MUTED} lineWidth={3} fill={CLEAR}>
            <Txt text={name} fontFamily={MONO} fontSize={30} fill="#FFFFFF" />
          </Rect>
        ))}
      </Rect>

      <Rect ref={box} position={[-450, 20]} size={[200, 200]} radius={8} fill={Posit.blue} opacity={0} />

      {PromptBar(bar, words, 'draw a blue box on the left')}
    </>,
  );

  // Light the chips for the properties being changed, dim the others
  function* light(active: number[]) {
    yield* all(
      ...chips.map((chip, i) => chip.fill(active.includes(i) ? Posit.orange : CLEAR, 0.3)),
      ...chips.map((chip, i) => chip.stroke(active.includes(i) ? Posit.orange : MUTED, 0.3)),
    );
  }

  const steps: {prompt: string; active: number[]; play: () => ThreadGenerator}[] = [
    {prompt: 'slide it to the right', active: [0], play: () => box().position.x(450, 1.2)},
    {prompt: 'make it bigger', active: [1], play: () => box().size([320, 320], 1.2)},
    {prompt: 'fade it out, then back in', active: [2], play: () => box().opacity(0.1, 0.7).to(1, 0.7)},
    {prompt: 'turn it orange', active: [3], play: () => box().fill(Posit.orange, 1.2)},
    {prompt: 'rotate it a quarter turn', active: [4], play: () => box().rotation(90, 1.2)},
    {prompt: 'round the corners until it is a circle', active: [5], play: () => box().radius(160, 1.2)},
    {
      prompt: 'now put it all back, at the same time',
      active: [0, 1, 2, 3, 4, 5],
      play: () =>
        all(
          box().position.x(-450, 1.6),
          box().size([200, 200], 1.6),
          box().fill(Posit.blue, 1.6),
          box().rotation(0, 1.6),
          box().radius(8, 1.6),
        ),
    },
  ];

  yield* title().opacity(1, 0.5);
  yield* all(bar().opacity(1, 0.5), box().opacity(1, 0.5));
  yield* waitFor(1);

  for (const step of steps) {
    yield* all(swapText(words(), step.prompt), light(step.active));
    yield* step.play();
    yield* waitFor(0.8);
  }
  yield* light([]);
  yield* waitFor(2);
});
