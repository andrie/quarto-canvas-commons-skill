import {makeScene2D} from '@motion-canvas/2d';
import {createRef, waitFor, all} from '@motion-canvas/core';
import {Rect, Txt, Line, Layout} from '@motion-canvas/2d/lib/components';
import {Posit} from '../styles';
import {Database} from '../components/Database';

export default makeScene2D(function* (view) {
  // Create references for our elements
  const userText = createRef<Txt>();
  const appLayout = createRef<Layout>();
  const llmLayout = createRef<Layout>();

  // Database components
  const databaseCenter = createRef<Database>();
  const databaseLeft = createRef<Database>();
  const databaseRight = createRef<Database>();

  // Connection lines
  const userToApp = createRef<Line>();
  const appToLlm = createRef<Line>();
  const appToCenterDb = createRef<Line>();
  const appToLeftDb = createRef<Line>();
  const appToRightDb = createRef<Line>();

  // Add elements to view - centered layout
  view.add(
    <>
      {/* User - no box, just text */}
      <Txt
        ref={userText}
        fontSize={63}
        fontFamily="Helvetica"
        fill={Posit.blue}
        text="User"
        position={[-300, 0]}
      />

      {/* App layout - box with centered text */}
      <Layout
        ref={appLayout}
        position={[0, 0]}
        size={[270, 135]}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Rect
          width={270}
          height={135}
          fill="rgba(0,0,0,0)"
          stroke={Posit.blue}
          lineWidth={6.75}
        />
        <Txt
          fontSize={63}
          fontFamily="Helvetica"
          fill={Posit.blue}
          text="App"
        />
      </Layout>

      {/* LLM layout - box with centered text */}
      <Layout
        ref={llmLayout}
        position={[400, 0]}
        size={[270, 135]}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Rect
          width={270}
          height={135}
          fill="rgba(0,0,0,0)"
          stroke={Posit.blue}
          lineWidth={6.75}
        />
        <Txt
          fontSize={63}
          fontFamily="Helvetica"
          fill={Posit.blue}
          text="LLM"
        />
      </Layout>

      {/* Database components - 3D database cylinders */}
      <Database
        ref={databaseCenter}
        size={[150, 150]}
        stroke={Posit.blue}
        lineWidth={6.75}
        position={[0, 250]}
      />

      <Database
        ref={databaseLeft}
        size={[150, 150]}
        stroke={Posit.blue}
        lineWidth={6.75}
        position={[0, 250]}
        opacity={0}
      />

      <Database
        ref={databaseRight}
        size={[150, 150]}
        stroke={Posit.blue}
        lineWidth={6.75}
        position={[0, 250]}
        opacity={0}
      />

      {/* Connection lines - bidirectional */}
      <Line
        ref={userToApp}
        points={[
          () => userText().right(),
          () => appLayout().left()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />

      <Line
        ref={appToLlm}
        points={[
          () => appLayout().right(),
          () => llmLayout().left()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />

      <Line
        ref={appToCenterDb}
        points={[
          () => appLayout().bottom(),
          () => databaseCenter().top()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        startArrow
        endArrow
        arrowSize={18}
      />

      <Line
        ref={appToLeftDb}
        points={[
          () => {
            const appBottom = appLayout().bottom();
            const centerTop = databaseCenter().top();
            return [(appBottom.x + centerTop.x) / 2, (appBottom.y + centerTop.y) / 2];
          },
          () => {
            const appBottom = appLayout().bottom();
            const centerTop = databaseCenter().top();
            const startY = (appBottom.y + centerTop.y) / 2;
            return [databaseLeft().top().x, startY];
          },
          () => databaseLeft().top()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        endArrow
        arrowSize={18}
        opacity={0}
      />

      <Line
        ref={appToRightDb}
        points={[
          () => {
            const appBottom = appLayout().bottom();
            const centerTop = databaseCenter().top();
            return [(appBottom.x + centerTop.x) / 2, (appBottom.y + centerTop.y) / 2];
          },
          () => {
            const appBottom = appLayout().bottom();
            const centerTop = databaseCenter().top();
            const startY = (appBottom.y + centerTop.y) / 2;
            return [databaseRight().top().x, startY];
          },
          () => databaseRight().top()
        ]}
        stroke={Posit.blue}
        lineWidth={4.5}
        endArrow
        arrowSize={18}
        opacity={0}
      />
    </>
  );

  // Wait a moment to show initial setup
  yield* waitFor(1);

  // Animate left database appearing and moving to position
  yield* all(
    databaseLeft().opacity(1, 2),
    databaseLeft().position([-300, 250], 2),
    appToLeftDb().opacity(1, 2)
  );

  yield* waitFor(0.5);

  // Animate right database appearing and moving to position
  yield* all(
    databaseRight().opacity(1, 2),
    databaseRight().position([300, 250], 2),
    appToRightDb().opacity(1, 2)
  );

  yield* waitFor(2);
});