import fs from 'node:fs';
import path from 'node:path';
import {addEntry} from './vite-project-array.js';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const rootIdx = args.indexOf('--root');
const rootValue = rootIdx >= 0 ? args[rootIdx + 1] : 'animations';
const root = path.resolve(rootValue ?? '.');

if (rootValue === undefined || !name || !/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
  console.error('usage: add-scene.js <name> [--root <animationsDir>]  (name: letters, digits, - and _)');
  process.exit(1);
}
const scenePath = path.join(root, 'src/scenes', `${name}.tsx`);
const projectPath = path.join(root, 'src', `${name}.ts`);
const vitePath = path.join(root, 'vite.config.ts');
for (const p of [scenePath, projectPath]) {
  if (fs.existsSync(p)) { console.error(`refusing to overwrite ${p}`); process.exit(1); }
}

const registered = addEntry(fs.readFileSync(vitePath, 'utf8'), `./src/${name}.ts`); // throws before any write if no array
fs.mkdirSync(path.dirname(scenePath), {recursive: true});
fs.writeFileSync(scenePath, `import {makeScene2D, Rect} from '@canvas-commons/2d';
import {createRef, waitFor} from '@canvas-commons/core';

export default makeScene2D(function* (view) {
  const rect = createRef<Rect>();
  view.add(<Rect ref={rect} width={200} height={200} fill="#447099" scale={0} />);
  yield* rect().scale(1, 1);
  yield* waitFor(2);
});
`);
fs.writeFileSync(projectPath, `import {makeProject} from '@canvas-commons/core';
import scene from './scenes/${name}?scene';

export default makeProject({
  scenes: [scene],
});
`);
fs.writeFileSync(vitePath, registered);
console.log(`created ${scenePath}\ncreated ${projectPath}\nregistered ./src/${name}.ts in vite.config.ts\nnext: run make anim, then use ./animations/src/${name}.js in the shortcode`);
