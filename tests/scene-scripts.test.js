import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
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

const cfg = (body, pre = '') => `${pre}export default { plugins: [motionCanvas({ project: [${body}] })] };\n`;
const entries = (src) => [...src.matchAll(/"(\.\/src\/[^"]+\.ts)"/g)].map((m) => m[1]);

test('a ] in a line comment does not end the array early', () => {
  const src = cfg('\n  // see [1]\n  "./src/a.ts",\n  "./src/b.ts",\n');
  const added = addEntry(src, './src/b.ts');
  assert.equal(added, src, 'existing entry after the comment is found');
  assert.deepEqual(entries(removeEntry(src, './src/b.ts')), ['./src/a.ts']);
});

test('a ] in a block comment or string does not end the array early', () => {
  const src = cfg('\n  /* x ] y */\n  "./src/a.ts",\n  "./src/we]ird.ts",\n  "./src/b.ts",\n');
  assert.equal(addEntry(src, './src/b.ts'), src);
  assert.ok(!removeEntry(src, './src/b.ts').includes('b.ts'));
});

test('project: [ mentioned in a comment is ignored', () => {
  const src = cfg('\n  "./src/a.ts",\n', '// project: [ "./src/old.ts" ]\n/* project: [ */\n');
  const out = addEntry(src, './src/n.ts');
  assert.ok(out.startsWith('// project: [ "./src/old.ts" ]\n/* project: [ */\n'));
  assert.deepEqual(entries(out), ['./src/old.ts', './src/n.ts', './src/a.ts']);
  assert.match(out, /project: \[\n        "\.\/src\/n\.ts",/);
});

test('add then remove with a // see [1] comment in the array round-trips', () => {
  const src = cfg('\n  // see [1]\n  "./src/a.ts",\n');
  const out = removeEntry(addEntry(src, './src/n.ts'), './src/n.ts');
  assert.equal(out, src);
});

test('empty project array works', () => {
  const out = addEntry(cfg(''), './src/n.ts');
  assert.deepEqual(entries(out), ['./src/n.ts']);
  assert.deepEqual(entries(removeEntry(out, './src/n.ts')), []);
});

test('unterminated array throws', () => {
  assert.throws(() => addEntry('motionCanvas({ project: [ "a"', './src/x.ts'), /project array not found/);
});

test('addEntry preserves CRLF line endings', () => {
  const crlf = fixture.replace(/\r?\n/g, '\r\n');
  const out = addEntry(crlf, './src/demo.ts');
  assert.ok(!/[^\r]\n/.test(out), 'no bare LF introduced');
  assert.match(out, /project:\s*\[\r\n\s*"\.\/src\/demo\.ts",\r\n/);
});

test('remove-scene warns on stderr when the config has no entry', () => {
  const root = tmpProject();
  fs.writeFileSync(path.join(root, 'src/scenes/ghost.tsx'), 'x');
  const r = spawnSync('node', [path.join(scripts, 'remove-scene.js'), 'ghost', '--root', root], {encoding: 'utf8'});
  assert.equal(r.status, 0);
  assert.match(r.stderr, /vite\.config\.ts has no entry for \.\/src\/ghost\.ts/);
  assert.ok(!fs.existsSync(path.join(root, 'src/scenes/ghost.tsx')));
});

test('remove-scene does not warn when the entry was registered', () => {
  const root = tmpProject();
  execFileSync('node', [path.join(scripts, 'add-scene.js'), 'demo', '--root', root]);
  const r = spawnSync('node', [path.join(scripts, 'remove-scene.js'), 'demo', '--root', root], {encoding: 'utf8'});
  assert.equal(r.stderr, '');
});

for (const script of ['add-scene.js', 'remove-scene.js']) {
  test(`${script} prints usage when --root has no value`, () => {
    const r = spawnSync('node', [path.join(scripts, script), 'demo', '--root'], {encoding: 'utf8'});
    assert.equal(r.status, 1);
    assert.match(r.stderr, /usage:/);
    assert.ok(!/TypeError/.test(r.stderr));
  });
}
