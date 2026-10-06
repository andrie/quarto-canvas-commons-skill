import {makeScene2D, Circle, Polygon, Path, Node, Layout, PathProps, Txt} from '@motion-canvas/2d';
import {all, chain, delay, createRef, waitFor, waitUntil, linear} from '@motion-canvas/core';

// function to create a polygon path
// function createChevronPath() {
//   // return  'M 0   0 L 200 100 L 200 150 L 0 250' +
//   //         'L 0 200 L 150 125 L   0  50 L 0   0';
//   return  'M 0 -125 L 200   -25 L 200  25 L 0  125' +
//           'L 0  075 L 150     0 L   0 -75 L 0 -125';
// }



function pointsToPath(points: number[][]) {
  let path = 'M ' + points[0][0] + ' ' + points[0][1];
  for (let i = 1; i < points.length; i++) {
    path += ' L ' + points[i][0] + ' ' + points[i][1];
  }
  return path;
}


function createChevronPath() {
  const points = [
    [0, -125],
    [200, -25],
    [200, 25],
    [0, 125],
    [0, 75],
    [150, 0],
    [0, -75],
    [0, -125],
  ];
  return pointsToPath(points);
}

export default makeScene2D(function* (view) {
  // const myCircle = createRef<Circle>();
  // const myPoly = createRef<Polygon>();
  
  const pLogo = createRef<Layout>();
  const rightChevron = createRef<Path>();
  const leftChevron = createRef<Path>();
  
  const pBoat = createRef<Layout>();
  const rightBoat = createRef<Path>();
  const leftBoat = createRef<Path>();

  const txtPosit = createRef<Txt>();
  const rect_path = 'M 0 -125 L 50 -125 L 50 125 L 0 125 L 0 -125'





  view.add(
    <>
      <Node ref={pLogo} >
        <Path ref={leftChevron} position={[-50,   0]} scale={1}   stroke='#666' rotation={180} lineWidth={5} data={rect_path} />,
        <Path ref={rightChevron} position={[50,   0]}   scale={1} stroke='#666' lineWidth={5} data={rect_path} />,
      </Node>
      <Node >
        <Txt ref={txtPosit} text='' fill='#666' fontFamily='Open Sans' fontSize={150} />
      </Node>
      <Node ref={pBoat} position={[0, 200]}>
        <Path ref={leftBoat}  position={[-50, 0]} scale={0.5} fill='#666' rotation={180} lineWidth={5} data={rect_path} />,
        <Path ref={rightBoat} position={[ 50, 0]} scale={0.5} fill='#666' lineWidth={5} data={rect_path} />,
      </Node>
    </>
  );


  
  function* animateText(ref:any, text: string) {
  const length = text.length;
  for (let i = 0; i <= length; i++) {
    // yield txtPosit().text(text.substring(0, i), duration / length);
    yield ref.text(text.substring(0, i), 3);
    yield waitFor(1);
  }
  // yield waitFor(1);
}
  yield* chain(
    waitFor(1),
    all(
      // logo transforms from prompt to chevron
      rightChevron().data(createChevronPath(), 1),
      leftChevron().data(createChevronPath(), 1),      
    ),
    all(
      // logo changes position
      rightChevron().position.x(-100, 1),
      leftChevron().position.x(100, 1),
    ),
    all(       
      // logo changes colour
      leftChevron().stroke('#e13238', 2),
      rightChevron().stroke('#33c', 2),
    ),
    all(
      // logo changes position
      pLogo().position([875, 425], 1),
      pLogo().scale(0.5, 1),
    ),
    waitUntil('text'),
    txtPosit().text('Posit goes Paddling', 3, linear),
    waitUntil('boat'),
    all(
      // boat changes shape
      leftBoat().data(createChevronPath(), 1),
      rightBoat().data(createChevronPath(), 1),
    ),
    all(
      // boat changes size
      leftBoat().position.x(0, 1),
      rightBoat().position.x(0, 1),
    ),
    all(
      leftBoat().scale.x(1.25, 1),
      rightBoat().scale.x(2, 1),
    ),
    waitUntil('end')
    // waitFor(1),
  )
});
