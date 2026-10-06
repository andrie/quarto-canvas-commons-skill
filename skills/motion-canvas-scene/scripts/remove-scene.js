import fs from 'node:fs';
import path from 'node:path';
import {removeEntry} from './vite-project-array.js';

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--root');
const rootValue = rootIdx >= 0 ? args[rootIdx + 1] : 'animations';
const root = path.resolve(rootValue ?? '.');

if (rootValue === undefined || !name || !/^[a-z0-9][a-z0-9_-]*$/i.test(name)) {
  console.error('usage: remove-scene.js <name> [--root <animationsDir>]');
  process.exit(1);
}
const vitePath = path.join(root, 'vite.config.ts');
const before = fs.readFileSync(vitePath, 'utf8');
const after = removeEntry(before, `./src/${name}.ts`);
if (after === before) console.error(`warning: vite.config.ts has no entry for ./src/${name}.ts (nothing to unregister)`);
fs.writeFileSync(vitePath, after);
for (const p of [path.join(root, 'src/scenes', `${name}.tsx`), path.join(root, 'src', `${name}.ts`)]) {
  fs.rmSync(p, {force: true});
}
console.log(`removed ${name}`);
