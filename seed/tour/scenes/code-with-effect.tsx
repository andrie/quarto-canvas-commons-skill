import {Code, Layout, Line, Rect, Txt, lines, makeScene2D} from '@canvas-commons/2d';
import {DEFAULT, Reference, all, createRef, createRefArray, sequence, waitFor} from '@canvas-commons/core';
import {rHighlighter} from '../components/highlighters';
import {PromptBar, Title, swapText} from '../components/stage';
import {BORDER, MONO, MUTED, PANEL, Posit, UI} from '../styles';

const rCode = `customers <- tibble(
  id = 1:3,
  name = c("Ada", "Bo", "Cy")
)
orders <- tibble(
  id = c(1, 1, 3, 4),
  item = c("pen", "ink", "pad", "cap")
)
left_join(customers, orders, by = "id")`;

// Each id has a colour, so a match can be followed by eye
const idColour: Record<number, string> = {1: Posit.blue, 2: Posit.orange, 3: Posit.teal, 4: Posit.burgundy};

type Cell = string | number;

interface TableSpec {
  name: string;
  columns: string[];
  rows: Cell[][];
}

const customers: TableSpec = {
  name: 'customers',
  columns: ['id', 'name'],
  rows: [[1, 'Ada'], [2, 'Bo'], [3, 'Cy']],
};

const orders: TableSpec = {
  name: 'orders',
  columns: ['id', 'item'],
  rows: [[1, 'pen'], [1, 'ink'], [3, 'pad'], [4, 'cap']],
};

const joined: TableSpec = {
  name: 'left_join(customers, orders)',
  columns: ['id', 'name', 'item'],
  rows: [[1, 'Ada', 'pen'], [1, 'Ada', 'ink'], [2, 'Bo', 'NA'], [3, 'Cy', 'pad']],
};

// [customer row, order row] pairs that share an id
const matches: [number, number][] = [[0, 0], [0, 1], [2, 2]];

const CELL_W = 130;
const CELL_H = 56;

function cell(value: Cell, first: boolean, colour: string) {
  const missing = value === 'NA';
  return (
    <Rect
      layout
      size={[CELL_W, CELL_H]}
      alignItems="center"
      justifyContent="center"
      fill={first ? colour : PANEL}
      stroke={BORDER}
      lineWidth={2}
    >
      <Txt text={`${value}`} fontFamily={MONO} fontSize={28} fontStyle={missing ? 'italic' : 'normal'} fill={missing ? MUTED : '#FFFFFF'} />
    </Rect>
  );
}

// A table as a column of rows. Rows start hidden when `hideRows` is set, so they can be revealed one by one.
function Table(spec: TableSpec, x: number, y: number, root: Reference<Layout>, rows: ReturnType<typeof createRefArray<Rect>>, hideRows: boolean) {
  return (
    <Layout ref={root} layout direction="column" alignItems="center" gap={8} position={[x, y]} anchor={[0, -1]} opacity={0}>
      <Txt text={spec.name} fontFamily={MONO} fontSize={26} fill={Posit.orange} />
      <Layout layout>
        {spec.columns.map(column => (
          <Rect layout size={[CELL_W, CELL_H]} alignItems="center" justifyContent="center">
            <Txt text={column} fontFamily={MONO} fontSize={24} fill={MUTED} />
          </Rect>
        ))}
      </Layout>
      <Layout layout direction="column">
        {spec.rows.map(row => (
          <Rect ref={rows} layout opacity={hideRows ? 0 : 1}>
            {row.map((value, i) => cell(value, i === 0, idColour[row[0] as number]))}
          </Rect>
        ))}
      </Layout>
    </Layout>
  );
}

export default makeScene2D(function* (view) {
  view.fill('#000000');

  const title = createRef<Txt>();
  const bar = createRef<Rect>();
  const words = createRef<Txt>();
  const note = createRef<Txt>();
  const panel = createRef<Rect>();
  const code = createRef<Code>();
  const customersTable = createRef<Layout>();
  const ordersTable = createRef<Layout>();
  const joinedTable = createRef<Layout>();
  const customerRows = createRefArray<Rect>();
  const orderRows = createRefArray<Rect>();
  const joinedRows = createRefArray<Rect>();
  const links = createRefArray<Line>();

  // Cardinal points are local to a node's parent, and the rows sit inside layouts. Find the edges in scene space, then express them in the view's own coordinates, which is where the lines live.
  const edgeOf = (node: Rect, side: 1 | -1) =>
    node.absolutePosition().add([(side * node.size().x) / 2, 0]).transformAsPoint(view.worldToLocal());

  view.add(
    <>
      {Title('Code on the left, what it does on the right', title)}

      <Rect ref={panel} position={[-500, -90]} size={[800, 470]} radius={16} fill={PANEL} stroke={MUTED} lineWidth={3} opacity={0}>
        <Code ref={code} highlighter={rHighlighter} code={rCode} fontFamily={MONO} fontSize={28} />
      </Rect>
      <Txt ref={note} position={[-500, 215]} width={800} fontFamily={UI} fontSize={32} fill="#FFFFFF" textAlign="center" opacity={0} />

      {Table(customers, 290, -380, customersTable, customerRows, false)}
      {Table(orders, 690, -380, ordersTable, orderRows, false)}
      {Table(joined, 490, 20, joinedTable, joinedRows, true)}

      {matches.map(([c, o]) => (
        <Line
          ref={links}
          points={[() => edgeOf(customerRows[c], 1), () => edgeOf(orderRows[o], -1)]}
          stroke={idColour[customers.rows[c][0] as number]}
          lineWidth={6}
          endArrow
          arrowSize={14}
          end={0}
        />
      ))}

      {PromptBar(bar, words, 'put the code on the left and show the join on the right')}
    </>,
  );

  yield* title().opacity(1, 0.5);
  yield* all(bar().opacity(1, 0.5), panel().opacity(1, 0.8));
  yield* waitFor(1.5);

  // Each block of code lights up while its table appears
  yield* all(code().selection(lines(0, 3), 0.5), swapText(note(), 'customers: three people, each with an id'));
  yield* customersTable().opacity(1, 0.6);
  yield* waitFor(1.5);

  yield* all(code().selection(lines(4, 7), 0.5), swapText(note(), 'orders: four orders, two of them for id 1'));
  yield* ordersTable().opacity(1, 0.6);
  yield* waitFor(1.5);

  // The join: matching ids are linked, then the combined table builds up
  yield* all(code().selection(lines(8), 0.5), swapText(note(), 'left_join pairs rows that share an id'));
  yield* sequence(0.3, ...links.map(link => link.end(1, 0.6)));
  yield* all(orderRows[3].opacity(0.25, 0.5), joinedTable().opacity(1, 0.4));
  yield* sequence(0.35, ...joinedRows.map(row => row.opacity(1, 0.5)));
  yield* waitFor(1);
  yield* swapText(note(), 'Bo has no orders, so gets NA. Order 4 has no customer, so it is dropped');
  yield* waitFor(3);
  yield* code().selection(DEFAULT, 0.6);
  yield* waitFor(1.5);
});
