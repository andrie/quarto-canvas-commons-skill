import {Line, Rect, Txt, makeScene2D} from '@canvas-commons/2d';
import {all, createRef, createRefArray, delay, waitFor} from '@canvas-commons/core';
import {Title} from '../components/stage';
import {MONO, MUTED, PANEL, Posit, UI} from '../styles';

interface StepSpec {
  title: string;
  detail: string;
  colour: string;
}

// The workflow, as data: the JSX maps over it
const steps: StepSpec[] = [
  {title: 'Describe', detail: 'the beats, the content,\nthe colours', colour: Posit.blue},
  {title: 'Generate', detail: 'Claude Code writes\nthe scene file', colour: Posit.teal},
  {title: 'Build', detail: 'make anim', colour: Posit.green},
  {title: 'Look', detail: 'make serve\nor make preview', colour: Posit.orange},
];

const BOX_W = 340;
const GAP = 120;
const boxX = (i: number) => (i - (steps.length - 1) / 2) * (BOX_W + GAP);

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const boxes = createRefArray<Rect>();
  const arrows = createRefArray<Line>();
  const back = createRef<Line>();
  const backLabel = createRef<Txt>();

  view.add(
    <>
      {Title('The loop: describe, build, look, refine', title, -380)}

      {steps.map((step, i) => (
        <Rect
          ref={boxes}
          layout
          direction="column"
          alignItems="center"
          justifyContent="center"
          gap={12}
          position={[boxX(i), -60]}
          size={[BOX_W, 210]}
          radius={16}
          fill={PANEL}
          stroke={step.colour}
          lineWidth={5}
          opacity={0}
        >
          <Txt text={`${i + 1}`} fontFamily={UI} fontSize={26} fontWeight={700} fill={step.colour} />
          <Txt text={step.title} fontFamily={UI} fontSize={44} fontWeight={700} fill="#FFFFFF" />
          <Txt
            text={step.detail}
            fontFamily={i === 2 ? MONO : UI}
            fontSize={i === 2 ? 28 : 24}
            fill={MUTED}
            textAlign="center"
          />
        </Rect>
      ))}

      {steps.slice(1).map((_, i) => (
        <Line
          ref={arrows}
          points={[() => boxes[i].right(), () => boxes[i + 1].left()]}
          stroke={MUTED}
          lineWidth={6}
          endArrow
          arrowSize={18}
          end={0}
        />
      ))}

      <Line
        ref={back}
        points={[
          () => boxes[steps.length - 1].bottom(),
          () => [boxX(steps.length - 1), 250],
          () => [boxX(0), 250],
          () => boxes[0].bottom(),
        ]}
        radius={50}
        stroke={Posit.orange}
        lineWidth={6}
        endArrow
        arrowSize={18}
        end={0}
      />
      <Txt ref={backLabel} text="Refine: say what to change" position={[0, 300]} fontFamily={UI} fontSize={34} fontWeight={600} fill={Posit.orange} opacity={0} />
    </>,
  );

  // Light up one step, dim the rest
  function* highlight(index: number) {
    yield* all(
      ...boxes.map((box, i) => box.fill(i === index ? steps[i].colour : PANEL, 0.3)),
      boxes[index].scale(1.06, 0.3),
      ...boxes.filter((_, i) => i !== index).map(box => box.scale(1, 0.3)),
    );
  }

  yield* title().opacity(1, 0.5);

  // Reveal the steps, each followed by its arrow
  for (let i = 0; i < steps.length; i++) {
    yield* boxes[i].opacity(1, 0.4);
    if (i < arrows.length) yield* arrows[i].end(1, 0.4);
  }
  yield* all(back().end(1, 0.9), delay(0.4, backLabel().opacity(1, 0.5)));
  yield* waitFor(1);

  // Walk round the loop twice
  for (let lap = 0; lap < 2; lap++) {
    for (let i = 0; i < steps.length; i++) {
      yield* highlight(i);
      yield* waitFor(0.6);
    }
  }
  yield* all(...boxes.map(box => box.fill(PANEL, 0.4)), ...boxes.map(box => box.scale(1, 0.4)));
  yield* waitFor(2);
});
