import fs from 'node:fs';
import path from 'node:path';
import {removeEntry} from './vite-project-array.js';

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const root = path.resolve(rootIdx >= 0 ? args[rootIdx + 1] : 'animations');

if (!name || !/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
  console.error('usage: remove-scene.js <name> [--root <animationsDir>]');
  process.exit(1);
}
const vitePath = path.join(root, 'vite.config.ts');
fs.writeFileSync(vitePath, removeEntry(fs.readFileSync(vitePath, 'utf8'), `./src/${name}.ts`));
for (const p of [path.join(root, 'src/scenes', `${name}.tsx`), path.join(root, 'src', `${name}.ts`)]) {
  fs.rmSync(p, {force: true});
}
console.log(`removed ${name}`);
