import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {addEntry, removeEntry} from '../skills/motion-canvas-scene/scripts/vite-project-array.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const scripts = path.join(here, '../skills/motion-canvas-scene/scripts');
const fixture = fs.readFileSync(path.join(here, 'fixtures/vite.config.ts'), 'utf8');

test('addEntry inserts a new entry into the project array', () => {
  const out = addEntry(fixture, './src/demo.ts');
  assert.match(out, /project:\s*\[\s*"\.\/src\/demo\.ts",/);
  assert.ok(out.includes('"./src/hexagons.ts"'), 'existing entries kept');
  assert.ok(out.includes('// "./src/retired.ts",'), 'comment kept');
});

test('addEntry is idempotent', () => {
  const once = addEntry(fixture, './src/demo.ts');
  assert.equal(addEntry(once, './src/demo.ts'), once);
});

test('removeEntry removes only the named entry, including the last one', () => {
  const out = removeEntry(fixture, './src/multi-database.ts');
  assert.ok(!out.includes('multi-database'));
  assert.ok(out.includes('"./src/infosec-triad.ts"'));
});

test('removeEntry on a missing entry leaves source unchanged', () => {
  assert.equal(removeEntry(fixture, './src/nope.ts'), fixture);
});

test('both throw when there is no project array', () => {
  assert.throws(() => addEntry('export default {}', './src/x.ts'), /project array not found/);
  assert.throws(() => removeEntry('export default {}', './src/x.ts'), /project array not found/);
});

function tmpProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scene-'));
  fs.mkdirSync(path.join(root, 'src/scenes'), {recursive: true});
  fs.writeFileSync(path.join(root, 'vite.config.ts'), fixture);
  return root;
}

test('add-scene creates both files and registers the scene', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  const scene = fs.readFileSync(path.join(root, 'src/scenes/demo.tsx'), 'utf8');
  const proj = fs.readFileSync(path.join(root, 'src/demo.ts'), 'utf8');
  assert.match(scene, /@canvas-commons\/2d/);
  assert.match(proj, /import scene from '\.\/scenes\/demo\?scene'/);
  assert.match(fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8'), /"\.\/src\/demo\.ts"/);
});

test('add-scene refuses to overwrite an existing scene', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  assert.throws(() => execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root], {stdio: 'pipe'}));
});

test('add-scene rejects unsafe names', () => {
  const root = tmpProject();
  assert.throws(() => execFileSync('node', [path.join(scripts, 'add-scene.js'), '../evil', '--root', root], {stdio: 'pipe'}));
});

test('remove-scene deletes both files and the registration', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  execFileSync('node', [path.join(scripts, 'remove-scene.js'), 'demo', '--root', root]);
  assert.ok(!fs.existsSync(path.join(root, 'src/scenes/demo.tsx')));
  assert.ok(!fs.existsSync(path.join(root, 'src/demo.ts')));
  assert.ok(!fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8').includes('demo'));
});
