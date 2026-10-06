import { SimpleSignal, SignalValue, PossibleColor } from '@canvas-commons/core';
import { initial, signal } from '@canvas-commons/2d';
import { Circle, Line, Layout, LayoutProps } from '@canvas-commons/2d';

export interface DatabaseProps extends LayoutProps {
  stroke?: SignalValue<PossibleColor>;
  lineWidth?: SignalValue<number>;
}

export class Database extends Layout {
  @initial('#447099')
  @signal()
  public declare readonly stroke: SimpleSignal<PossibleColor, this>;

  @initial(4.5)
  @signal()
  public declare readonly lineWidth: SimpleSignal<number, this>;

  public constructor(props?: DatabaseProps) {
    super({
      ...props,
      size: props?.size ?? [90, 60]
    });

    const ellipseHeight = this.height() / 3; // Ellipse is 1/3 of total height

    this.add(
      <>
        {/* Top ellipse (full) */}
        <Circle
          width={() => this.width()}
          height={ellipseHeight}
          fill="rgba(0,0,0,0)"
          stroke={() => this.stroke()}
          lineWidth={() => this.lineWidth()}
          position={[0, -this.height() / 2 + ellipseHeight / 2]}
        />

        {/* Bottom ellipse (partial - only front arc visible) */}
        <Circle
          width={() => this.width()}
          height={ellipseHeight}
          fill="rgba(0,0,0,0)"
          stroke={() => this.stroke()}
          lineWidth={() => this.lineWidth()}
          position={[0, this.height() / 2 - ellipseHeight / 2]}
          startAngle={0}
          endAngle={180}
        />

        {/* Left vertical line */}
        <Line
          points={[
            [-this.width() / 2, -this.height() / 2 + ellipseHeight / 2],
            [-this.width() / 2, this.height() / 2 - ellipseHeight / 2]
          ]}
          stroke={() => this.stroke()}
          lineWidth={() => this.lineWidth()}
        />

        {/* Right vertical line */}
        <Line
          points={[
            [this.width() / 2, -this.height() / 2 + ellipseHeight / 2],
            [this.width() / 2, this.height() / 2 - ellipseHeight / 2]
          ]}
          stroke={() => this.stroke()}
          lineWidth={() => this.lineWidth()}
        />
      </>
    );
  }
}