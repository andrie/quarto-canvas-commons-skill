import {Img, makeScene2D, Rect} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';
// An imported image: the build emits it as dist/animations/smoke.svg, and `base: "./"` in vite.config.ts lets the deck find it. If the circle is missing in the deck, check that setting.
import dot from '../assets/smoke.svg';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();
  const circle = createRef<Img>();

  view.add(<Rect ref={rect} width={200} height={200} fill="#447099" radius={20} scale={0} />);
  view.add(<Img ref={circle} src={dot} width={80} y={-170} opacity={0} />);

  yield* rect().scale(1, 1);
  yield* circle().opacity(1, 0.5);
  yield* rect().rotation(180, 1);
  yield* waitFor(1);
});
