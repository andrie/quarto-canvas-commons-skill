import {Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createRefArray, waitFor} from '@canvas-commons/core';
import {PromptBar, Title, swapText} from '../components/stage';
import {MUTED, PANEL, Posit, UI} from '../styles';

// The steps in the row, as data. The last one starts collapsed and is added later.
const steps = [
  {name: 'Load', colour: Posit.blue},
  {name: 'Clean', colour: Posit.teal},
  {name: 'Model', colour: Posit.orange},
  {name: 'Plot', colour: Posit.green},
  {name: 'Share', colour: Posit.burgundy},
];

const CARD_W = 220;
const GAP = 24;

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const note = createRef<Txt>();
  const row = createRef<Rect>();
  const cards = createRefArray<Rect>();

  view.add(
    <>
      {Title('Describe a layout, not coordinates', title)}

      <Rect
        ref={row}
        layout
        alignItems="center"
        gap={GAP}
        padding={GAP}
        position={[0, -20]}
        radius={20}
        fill={PANEL}
        stroke={MUTED}
        lineWidth={3}
        opacity={0}
      >
        {steps.map((step, i) => (
          <Rect
            ref={cards}
            layout
            alignItems="center"
            justifyContent="center"
            size={[i === steps.length - 1 ? 0 : CARD_W, 220]}
            margin={[0, 0, 0, i === steps.length - 1 ? -GAP : 0]}
            radius={14}
            fill={step.colour}
            opacity={i === steps.length - 1 ? 0 : 1}
          >
            <Txt text={step.name} fontFamily={UI} fontSize={44} fontWeight={700} fill="#FFFFFF" shrink={0} />
          </Rect>
        ))}
      </Rect>

      <Txt ref={note} position={[0, 220]} fontFamily={UI} fontSize={34} fill={MUTED} opacity={0} />

      {PromptBar(bar, words, 'put four steps in a row, evenly spaced')}
    </>,
  );

  const last = steps.length - 1;

  yield* title().opacity(1, 0.5);
  yield* all(bar().opacity(1, 0.5), row().opacity(1, 0.8));
  yield* waitFor(2);

  // A card grows, and its neighbours make room
  yield* swapText(words(), 'make the second step wider');
  yield* all(cards[1].width(420, 1.2), swapText(note(), 'the row recentres by itself'));
  yield* waitFor(1.2);

  // Fading keeps the space, so nothing jumps
  yield* swapText(words(), 'fade out the third step');
  yield* all(cards[2].opacity(0.1, 0.8), swapText(note(), 'a faded step still holds its place'));
  yield* waitFor(1.2);
  yield* cards[2].opacity(1, 0.6);

  // A new card pushes the others aside
  yield* swapText(words(), 'add a fifth step on the end');
  yield* all(
    cards[last].width(CARD_W, 1.2),
    cards[last].margin.left(0, 1.2),
    cards[last].opacity(1, 1.2),
    cards[1].width(CARD_W, 1.2),
    swapText(note(), 'the others shuffle along to fit'),
  );
  yield* waitFor(3);
});
