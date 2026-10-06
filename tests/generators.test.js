import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scripts = path.join(here, '../skills/motion-canvas-api/scripts');
const repo = path.join(here, 'fixtures/mini-repo');

// The generators need the `typescript` package. Point TS_PATH at a node_modules/typescript, or run
// `npm install --no-save typescript` where require.resolve finds it. Without it these tests FAIL,
// unless SKIP_GENERATOR_TESTS=1 is set explicitly (then they skip visibly).
function findTs() {
  if (process.env.TS_PATH) return process.env.TS_PATH;
  try {
    return path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
  } catch {
    return undefined;
  }
}
const ts = findTs();
const opts = {skip: process.env.SKIP_GENERATOR_TESTS === '1' ? 'SKIP_GENERATOR_TESTS=1' : false};
function needTs() {
  assert.ok(ts, 'typescript not found: set TS_PATH=<path to node_modules/typescript> or run `npm install --no-save typescript` (or set SKIP_GENERATOR_TESTS=1 to skip)');
}

function run(script, args) {
  needTs();
  const r = spawnSync(process.execPath, [path.join(scripts, script), '--repo', repo, '--ts', ts, ...args], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return r;
}

test('hierarchy lists Node above Layout above Shape, with JSDoc text', opts, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-')) + '/h.md';
  run('generate-component-hierarchy.js', ['--out', out]);
  const text = fs.readFileSync(out, 'utf8');
  const [n, l, s] = ['Node', 'Layout', 'Shape'].map((x) => text.indexOf(`── ${x}`) >= 0 ? text.indexOf(`── ${x}`) : text.indexOf(x));
  assert.ok(n >= 0 && n < l && l < s, 'Node, Layout, Shape in order');
  assert.match(text, /A base class for shapes with a fill and a stroke/);
  assert.match(text, /0\.4\.0/, 'header states the version');
});

test('search index has entries for Shape, its members and the flow function', opts, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-')) + '/i.json';
  run('generate-api-search.js', ['--out', out]);
  const idx = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(idx.version, '0.4.0');
  const shape = idx.entries.find((e) => e.name === 'Shape');
  assert.ok(shape, 'Shape entry');
  assert.equal(shape.kind, 'class');
  assert.equal(shape.package, '2d');
  assert.equal(shape.extends, 'Layout');
  assert.match(shape.description, /base class for shapes/);
  assert.ok(shape.members.some((m) => m.name === 'fill'), 'fill member');
  assert.ok(shape.examples.some((x) => x.includes('<Shape fill={\'red\'} />')), 'JSDoc example');
  assert.ok(shape.examples.some((x) => x.includes('blue')), 'docs example');
  const delay = idx.entries.find((e) => e.name === 'delay');
  assert.equal(delay.kind, 'function');
  assert.equal(delay.package, 'core');
  assert.ok(Array.isArray(idx.synonyms.rect) || Array.isArray(idx.synonyms.circle), 'synonym data kept');
});

test('search-api finds entries in the generated index, with synonym expansion', opts, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-')) + '/i.json';
  run('generate-api-search.js', ['--out', out]);
  const {search} = await import(path.join(scripts, 'search-api.js'));
  const idx = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(search(idx, 'shape')[0].name, 'Shape');
  assert.ok(search(idx, 'fill').some((e) => e.name === 'Shape'), 'member name match');
  const cli = spawnSync(process.execPath, [path.join(scripts, 'search-api.js'), 'Shape', '--index', out], {encoding: 'utf8'});
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /class Shape/);
});

const realIndex = JSON.parse(fs.readFileSync(path.join(here, '../skills/motion-canvas-api/references/api-search-index.json'), 'utf8'));

test('search-api: alias map finds the component ("box" and "rectangle" find Rect)', async () => {
  const {search} = await import(path.join(scripts, 'search-api.js'));
  assert.equal(search(realIndex, 'rectangle')[0].name, 'Rect');
  assert.equal(search(realIndex, 'box')[0].name, 'Rect');
});

test('search-api: typo fallback finds Rect for "retangle" and Circle for "circel"', async () => {
  const {search} = await import(path.join(scripts, 'search-api.js'));
  assert.equal(search(realIndex, 'retangle')[0].name, 'Rect');
  assert.equal(search(realIndex, 'circel')[0].name, 'Circle');
});

test('search-api: nonsense returns nothing and exact matches still rank first', async () => {
  const {search} = await import(path.join(scripts, 'search-api.js'));
  assert.deepEqual(search(realIndex, 'xyzzyqk'), []);
  assert.equal(search(realIndex, 'Rect')[0].name, 'Rect');
  assert.equal(search(realIndex, 'Polygon')[0].name, 'Polygon');
});
