import { makeScene2D, Circle, Rect, Txt, Line, Node } from "@canvas-commons/2d";
import { createRef, all, chain, waitFor, linear } from "@canvas-commons/core";
import { Posit } from "../lib/styles";

export default makeScene2D(function* (view) {
    const f = createRef<Txt>();
    view.add(
        <>
            <Txt ref={f} x={0} y={0} text={"0"} fontSize={300} fill={Posit.orange}/>
        </>
    );

    const anims = [];
    for(let i = 0; i <= 10; i++) {
        anims.push(f().text(i.toString(), 1, linear));
    }

    yield* chain(
        ...anims,
        // waitFor(1)
    )
});
