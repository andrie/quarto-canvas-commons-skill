import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hashDir, hashText, normaliseMakefile, loadKnownCopies, templateDir, upgrade} from '../skills/motion-canvas-scene/scripts/upgrade-project.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const legacy = path.join(here, 'fixtures/legacy-project');
const script = path.join(here, '../skills/motion-canvas-scene/scripts/upgrade-project.js');
const EXT = '_extensions/andrie/canvas-commons';
const OLD_EXT = '_extensions/andrie/motion-canvas';

const tplVersion = fs.readFileSync(path.join(templateDir, EXT, '_extension.yml'), 'utf8').match(/^version:\s*(\S+)/m)[1];
const copy = (src) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-upgrade-'));
  fs.cpSync(src, dir, {recursive: true});
  return dir;
};
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const kinds = (log) => log.map((l) => l.split(':')[0]);

test('the current template extension and Makefile are recorded as known copies', () => {
  const known = loadKnownCopies();
  assert.ok(known.extension[hashDir(path.join(templateDir, EXT))], 'run scripts/record-known-copies.js after changing the extension');
  const mk = fs.readFileSync(path.join(templateDir, 'Makefile'), 'utf8');
  assert.ok(known.makefile[hashText(normaliseMakefile(mk))], 'run scripts/record-known-copies.js after changing the Makefile');
});

test('plan mode on a legacy project changes nothing and lists every step', () => {
  const dir = copy(legacy);
  const before = hashDir(dir);
  const {log, pending} = upgrade(dir);
  assert.equal(hashDir(dir), before);
  const text = log.join('\n');
  assert.match(text, /upgrade: extension _extensions\/andrie\/motion-canvas \(.*\) is now _extensions\/andrie\/canvas-commons/);
  assert.match(text, /upgrade: Makefile is an unedited older template/);
  assert.match(text, /remove: vite\.player\.config\.ts/);
  assert.match(text, /remove: package\.json/);
  assert.match(text, /remove: talk\.qmd \(the script tag/);
  assert.equal(pending, 7);
  fs.rmSync(dir, {recursive: true});
});

test('--apply replaces the extension and Makefile but keeps the legacy files until asked', () => {
  const dir = copy(legacy);
  upgrade(dir, {apply: true});
  assert.equal(hashDir(path.join(dir, EXT)), hashDir(path.join(templateDir, EXT)));
  assert.ok(!fs.existsSync(path.join(dir, OLD_EXT)), 'the old folder name is removed');
  const mk = read(dir, 'Makefile');
  assert.match(mk, /^QMD_FILE = talk\.qmd$/m, 'the deck name survives');
  assert.match(mk, /^# >>> canvas-commons /m);
  assert.doesNotMatch(mk, /build:player/);
  for (const f of ['vite.player.config.ts', 'motion-canvas-ts.html', 'src/main.ts', 'package.json']) assert.ok(fs.existsSync(path.join(dir, f)), `${f} kept`);
  assert.match(read(dir, 'talk.qmd'), /motion-canvas-ts\.js/);
  fs.rmSync(dir, {recursive: true});
});

test('--apply --remove-legacy finishes the migration, and a second run has nothing to do', () => {
  const dir = copy(legacy);
  upgrade(dir, {apply: true, removeLegacy: true});
  for (const f of ['vite.player.config.ts', 'motion-canvas-ts.html', 'src', 'package.json']) assert.ok(!fs.existsSync(path.join(dir, f)), `${f} removed`);
  const deck = read(dir, 'talk.qmd');
  assert.doesNotMatch(deck, /motion-canvas-ts|include-in-header/);
  assert.match(deck, /resources:\n\s+- dist\/\*\*/, 'the resources entry stays');
  assert.match(deck, /\{\{< motion-canvas/, 'the slide content stays');
  const again = upgrade(dir);
  assert.equal(again.pending, 0);
  assert.deepEqual(kinds(again.log).filter((k) => k !== 'ok'), ['note'], 'only the shortcode name is left, and it still works');
  assert.match(again.log.join('\n'), /still uses \{\{< motion-canvas >\}\}/);
  fs.rmSync(dir, {recursive: true});
});

test('an edited extension is not replaced without --replace-extension', () => {
  const dir = copy(legacy);
  fs.appendFileSync(path.join(dir, OLD_EXT, 'motion-canvas-player.js'), '\n// my edit\n');
  const hash = hashDir(path.join(dir, OLD_EXT));
  const first = upgrade(dir, {apply: true});
  assert.equal(hashDir(path.join(dir, OLD_EXT)), hash);
  assert.ok(!fs.existsSync(path.join(dir, EXT)));
  assert.match(first.log.join('\n'), /decide: the extension in _extensions\/andrie\/motion-canvas has been edited/);
  upgrade(dir, {apply: true, replaceExtension: true});
  assert.equal(hashDir(path.join(dir, EXT)), hashDir(path.join(templateDir, EXT)));
  assert.ok(!fs.existsSync(path.join(dir, OLD_EXT)));
  fs.rmSync(dir, {recursive: true});
});

test('a Makefile with Canvas Commons rules that matches no known template is left for a human', () => {
  const dir = copy(legacy);
  fs.appendFileSync(path.join(dir, 'Makefile'), '\nmine:\n\techo hi\n');
  const mk = read(dir, 'Makefile');
  const {log} = upgrade(dir, {apply: true, removeLegacy: true});
  assert.equal(read(dir, 'Makefile'), mk);
  assert.match(log.join('\n'), /decide: the Makefile has Canvas Commons rules without the managed markers/);
  fs.rmSync(dir, {recursive: true});
});

test('the managed block is replaced in place and the user\'s own rules survive', () => {
  const dir = copy(legacy);
  upgrade(dir, {apply: true});
  const mk = read(dir, 'Makefile');
  fs.writeFileSync(path.join(dir, 'Makefile'), 'mine:\n\techo first\n\n' + mk.replace(/^# >>> canvas-commons \S+/m, '# >>> canvas-commons 0.1.0') + '\nafter:\n\techo last\n');
  const {log} = upgrade(dir, {apply: true});
  assert.match(log.join('\n'), /Makefile rules block is 0\.1\.0/);
  const next = read(dir, 'Makefile');
  assert.match(next, /^mine:\n\techo first/m);
  assert.match(next, /^after:\n\techo last/m);
  assert.match(next, new RegExp(`^# >>> canvas-commons ${tplVersion.replace(/\./g, '\\.')}`, 'm'));
  assert.equal(next.split('\n').filter((l) => l.startsWith('# >>> canvas-commons')).length, 1);
  fs.rmSync(dir, {recursive: true});
});

test('the command line prints the plan and exits 0', () => {
  const dir = copy(legacy);
  const out = execFileSync('node', [script, '--root', dir], {encoding: 'utf8'});
  assert.match(out, /7 upgrade step\(s\) pending; run again with --apply/);
  fs.rmSync(dir, {recursive: true});
});

test('a folder without animations/ is not upgraded', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-upgrade-'));
  assert.match(upgrade(dir).log[0], /decide: no animations\/ folder/);
  fs.rmSync(dir, {recursive: true});
});

test('both folder names present: an untouched old one is removed, an edited one is not', () => {
  const dir = copy(legacy);
  fs.cpSync(path.join(templateDir, EXT), path.join(dir, EXT), {recursive: true});
  const plan = upgrade(dir);
  assert.match(plan.log.join('\n'), /upgrade: _extensions\/andrie\/motion-canvas is the extension's old name and must go/);
  upgrade(dir, {apply: true});
  assert.ok(!fs.existsSync(path.join(dir, OLD_EXT)));
  fs.cpSync(path.join(legacy, OLD_EXT), path.join(dir, OLD_EXT), {recursive: true});
  fs.appendFileSync(path.join(dir, OLD_EXT, 'motion-canvas.lua'), '\n-- mine\n');
  const {log} = upgrade(dir, {apply: true});
  assert.ok(fs.existsSync(path.join(dir, OLD_EXT)), 'an edited old copy is kept');
  assert.match(log.join('\n'), /decide: _extensions\/andrie\/motion-canvas still exists next to/);
  fs.rmSync(dir, {recursive: true});
});

test('--rename-shortcode rewrites the old shortcode but not the escaped example', () => {
  const dir = copy(legacy);
  fs.appendFileSync(path.join(dir, 'talk.qmd'), '\n{{< motion-canvas ./animations/src/b.js loop=false >}}\n\n{{{< motion-canvas ./animations/src/example.js >}}}\n');
  upgrade(dir, {apply: true});
  assert.match(read(dir, 'talk.qmd'), /\{\{< motion-canvas /, 'not renamed without the flag');
  const {log} = upgrade(dir, {apply: true, renameShortcode: true});
  const deck = read(dir, 'talk.qmd');
  assert.doesNotMatch(deck, /(?<!\{)\{\{< motion-canvas/);
  assert.match(deck, /\{\{< canvas-commons \.\/animations\/src\/smoke\.js/);
  assert.match(deck, /\{\{< canvas-commons \.\/animations\/src\/b\.js loop=false >\}\}/);
  assert.match(deck, /\{\{\{< motion-canvas \.\/animations\/src\/example\.js >\}\}\}/, 'the escaped example is left alone');
  assert.match(log.join('\n'), /done: talk\.qmd: renamed/);
  fs.rmSync(dir, {recursive: true});
});
