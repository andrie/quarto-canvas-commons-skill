import {makeScene2D} from '@motion-canvas/2d/lib/scenes';;
import {createRef, useLogger} from '@motion-canvas/core/lib/utils';
import {all, delay, chain, waitFor} from '@motion-canvas/core/lib/flow';
import {createSignal} from '@motion-canvas/core/lib/signals';
import {linear} from '@motion-canvas/core/lib/tweening';
import {Circle, Line, Polygon, Node, Rect} from '@motion-canvas/2d/lib/components';
import {PossibleVector2, Vector2} from '@motion-canvas/core/lib/types';
// import {useLogger} from '@motion-canvas/core';

const WIDTH = 1920;
const HEIGHT = 1080;
const P50 = "50%";
const P100 = "100%";

// position 1
const raw1:number[][] = [
[6.6, 4.6],
[8, 6],
[3, 1],
[1.3, -0.5],
[5, 3],
[6, 4],
[7.3, 3.7],
[7, 3],
[3.7, 1.7],
[5, 1.6],
[5.6, 2.3],
[7, 0],
[6, 3],
[4.7, 0.7],
[6.3, 2.65],
[4, 0],
]

// position 3
const raw3:number[][] = [
[2.7, 3.7],
[1.5, 5],
[6.5, 0.5],
[7, -0.5],
[4.8, 2],
[3.6, 3.2],
[5, 2.5],
[6, 2.5],
[5.6, 1.3],
[7.5, 1.5],
[7, 2.6],
[7, 0],
[6.2, 3.1],
[4.7, 0.7],
[6.5, 2.55],
[4, 0],
]

// position 4
const raw4:number[][] = [
[2.3, 2.5],
[0.5, 2.7],
[6, 2.5],
[8.5, 2.5],
[5, 2.5],
[3.5, 2.6],
[5, 2.3],
[6, 2.5],
[7, 2.5],
[7, 2.5],
[7.3, 2.7],
[7, 0],
[6.3, 3.3],
[4.7, 0.7],
[6.65, 2.6],
[4, 0],
]

// position 5
const raw5:number[][] = [
[6.5, 0.5],
[7, -0.7],
[2.7, 3.7],
[1.5, 5],
[4.8, 4.8],
[5.6, 1.3],
[7.5, 1.5],
[7, 2.6],
[3.6, 3.2],
[5, 2.5],
[6, 2.5],
[7, 0],
[6.2, 3.1],
[4.7, 0.7],
[6.5, 2.55],
[4, 0],
]

// position 6
const raw6:number[][] = [
  [3, 1],
[1.3, -0.7],
[6.6, 4.6],
[8, 6],
[5, 3],
[3.7, 1.7],
[5, 1.6],
[5.6, 2.3],
[6, 4],
[7.3, 3.7],
[7, 3],
[7, 0],
[6, 3],
[4.7, 0.7],
[6.3, 2.65],
[4, 0],
]




const raw = raw1;
const scaling = 30;
const keypoints:PossibleVector2[] = raw.map(p => [(p[0] - 5) * scaling, -p[1] * scaling]);

// function to convert raw keypoints to Vector2
// const kps:Vector2[] = keypoints.map(p => new Vector2(p[0], p[1]));

function convert_keypoints(raw:number[][], scaling:number):Vector2[] {
  const keypoints:PossibleVector2[] = raw.map(p => [(p[0] - 5) * scaling, -p[1] * scaling]);
  return keypoints.map((p: [number, number]) => new Vector2(p[0], p[1]));
  // return keypoints
}

const kps = convert_keypoints(raw1, 30);


// const kps:PossibleVector2[] = keypoints;
// const kp = kps

export default makeScene2D(function* (view) {

  // const myPoly = createRef<Polygon>();
  // const radius = createSignal(100);
  // const nsides = createSignal(6);
  const logger = useLogger();
  const kp = createSignal(convert_keypoints(raw1, 30));
  const WATER="#1E514B";
  const AIR="#C4D5E7";
  const BOAT="#0D57DD";

  view.add(
    <>
      <Polygon
        position = {[0,0]}
        sides={6}
        size = {650}
        fill={'#88a'}
        stroke={'#00f'}
        lineWidth={15} 
        clip={true}
        margin={20}
        scale={1.5}
        >
        <Node x={-10} y={129} scale={[-1.9, 1.9]} >

          <Rect x={-5} y={-150} size={[290, 300]} fill={AIR}/>
          <Rect x={-5} y={50} size={[290, 100]} fill={WATER}/>
          
          {/* paddle */}
          
          <Line points={() => [kp()[0], kp()[2]]} lineWidth={2} stroke={"#000"}/>



          {/* right paddle blade */}
          <Line points={() => [kp()[2], kp()[3]]} lineWidth={4} stroke={"#222"}/>


          {/* right arm */}
          <Line points={() => [kp()[8],  kp()[9]]} lineWidth={3} stroke={"#ccc"}/>
          <Line points={() => [kp()[9], kp()[10]]} lineWidth={5} stroke={"#ccc"} radius={5}/>

          {/* head */}
          <Circle 
            position={() => kp()[12]} 
            // y={kp[11]} 
            size={24} 
            fill={"#fff"}
          />

          {/* body */}
          <Line
            points={[
              () => kp()[7],
              () => kp()[10],
              () => kp()[11],
              () => kp()[7],
            ]} 
            stroke={AIR}
            radius={5}
            lineWidth={5}
            fill={AIR}
          />
          {/* top of spine to hip*/}
          <Line points={() => [ kp()[11], kp()[14] ]} lineWidth={6} stroke={"#fff"} endOffset={5}/>

          {/* left arm */}
          <Line points={() => [kp()[5], kp()[6]]} lineWidth={4} stroke={"#eee"}/>
          <Line points={() => [kp()[6], kp()[7]]} lineWidth={6} stroke={"#eee"}/>
          


          {/* hip to knee */}
          <Line points={[
            () => kp()[11], kp()[13],
            () => kp()[13], kp()[15] 
          ]} lineWidth={6} stroke={"#fff"}/>
          
          {/* Boat */}
          <Line points={() => [[-150,5],[140,5]]} lineWidth={20} stroke={BOAT}/>
3
          {/* left paddle blade */}
          <Line points={() => [kp()[0], kp()[1]]} lineWidth={4} stroke={"#222"}/> 

          Rec

          </Node>
          </Polygon>
      <Polygon
        position = {[0,0]}
        sides={6}
        size = {650}
        // fill={'#88a'}
        stroke={BOAT}
        lineWidth={15} 
        // clip={true}
        // margin={20}
        scale={1.5}
        >
          </Polygon>
    </>
  )
  
  
  const delay_amt_1 = 0.5
  const delay_amt_2 = 1.0
  yield* chain(
    kp(convert_keypoints(raw3, 30), delay_amt_2, linear),
    kp(convert_keypoints(raw6, 30), delay_amt_1, linear),
    kp(convert_keypoints(raw5, 30), delay_amt_2, linear),
    kp(convert_keypoints(raw1, 30), delay_amt_1, linear),
  );
  


});

