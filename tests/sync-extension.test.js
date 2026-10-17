import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sync, OWNED} from '../scripts/sync-extension.js';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendored = path.join(repo, 'skills/motion-canvas-scene/assets/project-template');
const script = path.join(repo, 'scripts/sync-extension.js');

// A stand-in for a quarto-canvas-commons checkout, built from the vendored template.
function fakeSource() {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-src-'));
  fs.cpSync(vendored, path.join(src, 'template'), {recursive: true});
  fs.rmSync(path.join(src, 'template', OWNED[0]));
  fs.cpSync(path.join(vendored, '_extensions'), path.join(src, '_extensions'), {recursive: true});
  return src;
}
const tmpCopy = () => {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-dest-'));
  fs.cpSync(vendored, dest, {recursive: true});
  return dest;
};

test('the vendored template is already in sync with a source that has the same files', () => {
  const src = fakeSource();
  assert.deepEqual(sync(src, vendored, {check: true}), []);
  fs.rmSync(src, {recursive: true});
});

test('sync adds, updates and removes files, and leaves the skill-owned ones alone', () => {
  const src = fakeSource();
  const dest = tmpCopy();
  fs.writeFileSync(path.join(src, 'template/extra.txt'), 'new');
  fs.appendFileSync(path.join(src, 'template/Makefile'), '# changed\n');
  fs.mkdirSync(path.join(dest, '_extensions/andrie/motion-canvas'), {recursive: true});
  fs.writeFileSync(path.join(dest, '_extensions/andrie/motion-canvas/old.js'), 'old');
  fs.writeFileSync(path.join(dest, 'stale.txt'), 'stale');
  fs.appendFileSync(path.join(dest, OWNED[0]), '// the skill owns this\n');
  const styles = fs.readFileSync(path.join(dest, OWNED[0]), 'utf8');

  const dry = sync(src, dest, {check: true});
  assert.deepEqual(dry.map((c) => `${c.kind} ${c.file}`).sort(), [
    'add extra.txt', 'remove _extensions/andrie/motion-canvas/old.js', 'remove stale.txt', 'update Makefile',
  ]);
  assert.ok(fs.existsSync(path.join(dest, 'stale.txt')), 'check changes nothing');

  sync(src, dest);
  assert.equal(fs.readFileSync(path.join(dest, 'extra.txt'), 'utf8'), 'new');
  assert.match(fs.readFileSync(path.join(dest, 'Makefile'), 'utf8'), /# changed/);
  assert.ok(!fs.existsSync(path.join(dest, 'stale.txt')));
  assert.ok(!fs.existsSync(path.join(dest, '_extensions/andrie/motion-canvas')), 'the emptied folder goes too');
  assert.equal(fs.readFileSync(path.join(dest, OWNED[0]), 'utf8'), styles);
  assert.deepEqual(sync(src, dest, {check: true}), [], 'a second run has nothing to do');
  fs.rmSync(src, {recursive: true});
  fs.rmSync(dest, {recursive: true});
});

test('sync refuses a source whose template copy of the extension is stale', () => {
  const src = fakeSource();
  fs.appendFileSync(path.join(src, '_extensions/andrie/canvas-commons/canvas-commons.lua'), '-- newer\n');
  assert.throws(() => sync(src, tmpCopy(), {check: true}), /run scripts\/sync-template\.sh there first/);
  fs.rmSync(src, {recursive: true});
});

test('the command line records where the template came from', () => {
  const src = fakeSource();
  const dest = tmpCopy();
  const out = execFileSync('node', [script, '--from', src, '--to', dest], {encoding: 'utf8'});
  assert.match(out, /already in sync with \d/);
  const info = JSON.parse(fs.readFileSync(path.join(dest, '..', 'extension-source.json'), 'utf8'));
  assert.match(info.version, /^\d+\.\d+\.\d+$/);
  const bad = spawnSync('node', [script, '--from', src, '--to', dest, '--check'], {encoding: 'utf8'});
  assert.equal(bad.status, 0);
  fs.rmSync(src, {recursive: true});
  fs.rmSync(path.join(dest, '..', 'extension-source.json'), {force: true});
  fs.rmSync(dest, {recursive: true});
});
