import {makeScene2D} from '@motion-canvas/2d';
import {createRef, waitFor} from '@motion-canvas/core';
import {Polygon, Txt, Layout, Node} from '@motion-canvas/2d/lib/components';
import {Posit} from '../styles';

export default makeScene2D(function* (view) {
  // Calculate scene dimensions for 70% height
  const sceneHeight = view.height() * 0.7;
  const sceneWidth = view.width() * 0.7;

  // Create references for the container and elements
  const diagramContainer = createRef<Node>();
  const triangleRef = createRef<Polygon>();
  const confidentialityText = createRef<Txt>();
  const integrityText = createRef<Txt>();
  const availabilityText = createRef<Txt>();

  // Triangle dimensions (scaled to fit 70% of scene height)
  const desiredTriangleHeight = sceneHeight * 0.6; // Triangle itself takes 60% of the allocated space
  const desiredTriangleWidth = desiredTriangleHeight * 1.2; // Slightly wider for better proportions

  // Compensate for Motion Canvas Polygon inscribed behavior
  // Triangle is inscribed in ellipse, so actual size is smaller than bounding box
  const triangleWidth = desiredTriangleWidth / 0.866; // Compensate for ~√3/2 factor
  const triangleHeight = desiredTriangleHeight / 0.75; // Compensate for height reduction


  // Text spacing from triangle edges
  const textSpacing = 100;

  view.add(
    <Node
      ref={diagramContainer}
      position={[0, 100]} // Change this position to move the entire diagram up or down
    >
      {/* Triangle shape using Polygon */}
      <Polygon
        ref={triangleRef}
        sides={3}
        size={[triangleWidth, triangleHeight]}
        stroke={Posit.blue}
        lineWidth={15}
        fill="rgba(0,0,0,0)"
        position={[0, 0]}
        rotation={0}
      />

      {/* Confidentiality text - positioned above vertex 0 (top) */}
      <Txt
        ref={availabilityText}
        fontSize={sceneHeight * 0.08}
        fontFamily="Helvetica"
        fill={Posit.blue}
        text="Availability"
        position={() => [
          triangleRef().vertex(0).x,
          triangleRef().vertex(0).y - textSpacing
        ]}
        textAlign="center"
        opacity={0}
      />

      {/* Integrity text - positioned below vertex 2 (bottom left) */}
      <Txt
        ref={integrityText}
        fontSize={sceneHeight * 0.08}
        fontFamily="Helvetica"
        fill={Posit.blue}
        text="Integrity"
        position={() => [
          triangleRef().vertex(2).x,
          triangleRef().vertex(2).y + textSpacing
        ]}
        textAlign="center"
        opacity={0}
      />

      {/* Availability text - positioned below vertex 1 (bottom right) */}
      <Txt
        ref={confidentialityText}
        text="Confidentiality"
        fontSize={sceneHeight * 0.08}
        fontFamily="Helvetica"
        fill={Posit.blue}
        position={() => [
          triangleRef().vertex(1).x,
          triangleRef().vertex(1).y + textSpacing
        ]}
        textAlign="center"
        opacity={0}
      />
    </Node>
  );

  // Triangle appears immediately (it's already visible)
  // Then animate each text label sequentially with 1 second gaps

  // Fade in "Confidentiality"
  yield* availabilityText().opacity(1, 2);
  yield* integrityText().opacity(1, 2);
  yield* confidentialityText().opacity(1, 2);

  // Wait 1 second, then fade in "Integrity"
  // yield* waitFor(1);

  // Wait 1 second, then fade in "Availability"
  // yield* waitFor(1);
});