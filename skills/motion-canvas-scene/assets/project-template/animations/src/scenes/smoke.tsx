import {makeScene2D, Rect} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();

  view.add(<Rect ref={rect} width={200} height={200} fill="#447099" radius={20} scale={0} />);

  yield* rect().scale(1, 1);
  yield* rect().rotation(180, 1);
  yield* waitFor(1);
});
