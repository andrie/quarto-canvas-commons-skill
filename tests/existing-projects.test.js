import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mergePackageJson} from '../skills/motion-canvas-scene/scripts/merge-package-json.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.join(here, '../skills/motion-canvas-scene');
const tpl = path.join(skill, 'assets/project-template');
const fixtures = path.join(here, 'fixtures/existing-projects');
const merge = path.join(skill, 'scripts/merge-package-json.js');
const tplPkg = JSON.parse(fs.readFileSync(path.join(tpl, 'package.json'), 'utf8'));

function tmpCopy(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-existing-'));
  fs.cpSync(src, dir, {recursive: true});
  return dir;
}
const makeN = (dir, ...args) => execFileSync('make', ['-n', ...args], {cwd: dir, encoding: 'utf8'});

test('mergePackageJson adds missing deps and build:player, keeps user values', () => {
  const user = JSON.parse(fs.readFileSync(path.join(fixtures, 'quarto-with-tooling/package.json'), 'utf8'));
  const {merged, report} = mergePackageJson(tplPkg, user);
  assert.equal(merged.scripts.build, 'quarto render deck.qmd');
  assert.equal(merged.scripts['build:player'], 'vite build -c vite.player.config.ts');
  assert.equal(merged.devDependencies.vite, '^6.3.5');
  assert.equal(merged.dependencies?.vite, undefined, 'vite in devDependencies counts as present');
  assert.equal(merged.dependencies['@canvas-commons/core'], '^0.4.0');
  assert.equal(merged.name, 'tooling-deck');
  assert.deepEqual(report.conflicts, ['vite: kept ^6.3.5, template wants ^7.1.5']);
});

test('mergePackageJson reports a build:player conflict and leaves it alone', () => {
  const {merged, report} = mergePackageJson(tplPkg, {scripts: {'build:player': 'echo mine'}});
  assert.equal(merged.scripts['build:player'], 'echo mine');
  assert.ok(report.conflicts.some((c) => c.startsWith('scripts.build:player')));
});

test('merge-package-json.js --dry-run writes nothing; a real run is idempotent', () => {
  const dir = tmpCopy(path.join(fixtures, 'quarto-with-tooling'));
  const pkg = path.join(dir, 'package.json');
  const before = fs.readFileSync(pkg, 'utf8');
  assert.match(execFileSync('node', [merge, path.join(tpl, 'package.json'), pkg, '--dry-run'], {encoding: 'utf8'}), /dry run/);
  assert.equal(fs.readFileSync(pkg, 'utf8'), before);
  execFileSync('node', [merge, path.join(tpl, 'package.json'), pkg]);
  const once = fs.readFileSync(pkg, 'utf8');
  assert.match(execFileSync('node', [merge, path.join(tpl, 'package.json'), pkg], {encoding: 'utf8'}), /nothing to add/);
  assert.equal(fs.readFileSync(pkg, 'utf8'), once);
  fs.rmSync(dir, {recursive: true});
});

test('template Makefile: targets drive the build and render QMD_FILE', () => {
  const dir = tmpCopy(tpl);
  const anim = makeN(dir, 'anim');
  assert.match(anim, /npm run build:player/);
  assert.match(anim, /npm --prefix \.\/animations run build/);
  assert.match(makeN(dir, 'quarto'), /quarto render deck\.qmd/);
  assert.match(makeN(dir, 'quarto', 'QMD_FILE=conf-talk.qmd'), /quarto render conf-talk\.qmd/);
  assert.match(makeN(dir, 'preview'), /quarto preview deck\.qmd --no-browser --port 4200/);
  assert.match(makeN(dir), /quarto publish deck\.qmd/, 'default goal is all');
  fs.rmSync(dir, {recursive: true});
});

test('the collision check bootstrap.md describes finds the fixture Makefile targets it shares with the template', () => {
  const dir = tmpCopy(path.join(fixtures, 'quarto-with-tooling'));
  const db = spawnSync('make', ['-pRrq', '-f', 'Makefile'], {cwd: dir, encoding: 'utf8'}).stdout;
  const hits = ['all', 'install', 'anim', 'force-build', 'serve', 'quarto', 'preview', 'publish', 'clean'].filter((t) => new RegExp(`^${t}:`, 'm').test(db));
  assert.deepEqual(hits, ['all', 'clean']);
  fs.rmSync(dir, {recursive: true});
});

test('fixtures are the tiny existing projects the bootstrap docs describe', () => {
  const a = path.join(fixtures, 'quarto-with-tooling');
  for (const f of ['deck.qmd', '_quarto.yml', 'Makefile', 'package.json', 'vite.config.ts', '.gitignore']) {
    assert.ok(fs.existsSync(path.join(a, f)), f);
  }
  const b = path.join(fixtures, 'plain-quarto');
  assert.match(fs.readFileSync(path.join(b, 'index.qmd'), 'utf8'), /^format: revealjs$/m);
  for (const f of ['Makefile', 'package.json']) assert.ok(!fs.existsSync(path.join(b, f)), f);
});
