import {easeInCubic, easeOutCubic} from '@canvas-commons/core';

/**
 * Pulse animation utility function
 * Makes an element grow and then shrink back to original scale
 *
 * @param element - The element to animate (must have scale() method)
 * @param options - Animation options
 * @param options.scaleGrowth - Amount to increase scale (default 0.1 = 10% larger)
 * @param options.duration - Total animation duration (default 0.5s)
 */
export function* pulse(
  element: any,
  options: {
    scaleGrowth?: number;
    duration?: number;
  } = {}
) {
  const {
    scaleGrowth = 0.1, // 10% scale increase by default
    duration = 0.5
  } = options;

  // Get current scale
  const currentScale = element.scale();

  // Calculate target scale
  const targetScale = currentScale.add(scaleGrowth);

  // Grow animation
  yield* element.scale(targetScale, duration / 2, easeInCubic);

  // Shrink animation
  yield* element.scale(currentScale, duration / 2, easeOutCubic);
}