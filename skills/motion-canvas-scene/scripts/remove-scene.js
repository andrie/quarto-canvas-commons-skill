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
const removed = [];
const rm = (p) => { if (fs.existsSync(p)) { fs.rmSync(p, {force: true}); removed.push(p); } };
// The sources, and the .meta files the editor and vite plugin write next to them.
for (const ext of ['.tsx', '.meta']) rm(path.join(root, 'src/scenes', `${name}${ext}`));
for (const ext of ['.ts', '.meta']) rm(path.join(root, 'src', `${name}${ext}`));
// The built bundle and anything else named <name>.* (source map, assets) in the build output.
const out = path.join(root, '../dist/animations/src');
if (fs.existsSync(out)) {
  for (const f of fs.readdirSync(out)) if (f.startsWith(`${name}.`)) rm(path.join(out, f));
}
for (const p of removed) console.log(`deleted ${path.relative(process.cwd(), p) || p}`);
console.log(`removed ${name}`);
