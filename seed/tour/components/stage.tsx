import {Rect, Txt} from '@canvas-commons/2d';
import {Reference} from '@canvas-commons/core';
import {MUTED, PANEL, Posit, UI} from '../styles';

// Shared frame for the guide scenes: a title at the top and a "prompt bar" at
// the bottom that shows the sentence you would give Claude Code to get what is
// on screen.

export function Title(text: string, ref: Reference<Txt>, y = -440) {
  return <Txt ref={ref} text={text} position={[0, y]} fontFamily={UI} fontSize={54} fontWeight={700} fill="#FFFFFF" opacity={0} />;
}

export function PromptBar(bar: Reference<Rect>, words: Reference<Txt>, text: string) {
  return (
    <Rect
      ref={bar}
      layout
      position={[0, 440]}
      alignItems="center"
      gap={24}
      padding={[16, 32]}
      radius={14}
      fill={PANEL}
      stroke={Posit.blue}
      lineWidth={3}
      opacity={0}
    >
      <Txt text="Ask Claude" fontFamily={UI} fontSize={24} fontWeight={700} fill={Posit.orange} />
      <Txt ref={words} text={text} fontFamily={UI} fontSize={32} fill="#FFFFFF" />
    </Rect>
  );
}

// A small caption under a shape or beside a result
export function Label(text: string, fontSize = 28, fill = MUTED) {
  return <Txt text={text} fontFamily={UI} fontSize={fontSize} fill={fill} />;
}

// Fade a text node out, swap its text and fade it back in
export function* swapText(node: Txt, text: string, fade = 0.25) {
  yield* node.opacity(0, fade);
  node.text(text);
  yield* node.opacity(1, fade);
}
