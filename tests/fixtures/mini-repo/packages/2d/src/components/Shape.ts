/**
 * A base class for shapes with a fill and a stroke.
 *
 * @example
 * ```tsx
 * <Shape fill={'red'} />
 * ```
 */
export abstract class Shape extends Layout {
  /**
   * The colour used to fill the shape.
   */
  public fill = 'black';
}
