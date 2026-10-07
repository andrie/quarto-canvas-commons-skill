const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
const lib = path.join(repo, 'skills', 'canvas-commons-library', 'styles.ts');
const tpl = path.join(repo, 'skills', 'motion-canvas-scene', 'assets', 'project-template', 'animations', 'src', 'styles.ts');

test('template styles.ts is a byte-identical snapshot of the library file', () => {
  assert.ok(fs.readFileSync(tpl).equals(fs.readFileSync(lib)));
});

test('library styles.ts keeps Colors.TEXT at #ACB3BF', () => {
  assert.match(fs.readFileSync(lib, 'utf8'), /TEXT:\s*'#ACB3BF'/);
});

const tplRoot = path.join(repo, 'skills', 'motion-canvas-scene', 'assets', 'project-template');
const read = (rel) => fs.readFileSync(path.join(tplRoot, rel), 'utf8');

test('template builds the player from vite.player.config.ts, not a root vite.config.ts', () => {
  assert.ok(fs.existsSync(path.join(tplRoot, 'vite.player.config.ts')));
  assert.ok(!fs.existsSync(path.join(tplRoot, 'vite.config.ts')));
  const pkg = JSON.parse(read('package.json'));
  assert.strictEqual(pkg.scripts['build:player'], 'vite build -c vite.player.config.ts');
  assert.strictEqual(pkg.scripts.build, undefined, 'no generic build script to collide with a project\'s own');
  const mk = read('Makefile');
  assert.match(mk, /npm run build:player/);
  assert.match(mk, /vite\.player\.config\.ts/);
  assert.match(mk, /find -L animations\/src/);
});

test('template deck is deck.qmd and nothing names smoke.qmd or smoke.html', () => {
  assert.ok(!fs.existsSync(path.join(tplRoot, 'smoke.qmd')));
  const deck = read('deck.qmd');
  assert.match(deck, /- dist\/\*\*/);
  assert.match(deck, /- text: <script src="\.\/dist\/motion-canvas-ts\.js"><\/script>/);
  assert.match(deck, /motion-canvas \.\/animations\/src\/smoke\.js/);
  assert.match(deck, /remove-scene\.js smoke/);
  assert.match(read('Makefile'), /^QMD_FILE = deck\.qmd$/m);
  for (const f of ['Makefile', '.gitignore']) {
    assert.doesNotMatch(read(f), /smoke\.(qmd|html)/, f);
  }
});

test('template .gitignore lists the build artefacts but no deck html', () => {
  const lines = read('.gitignore').split('\n');
  for (const l of ['node_modules/', 'dist/', '.quarto/', '*_files/', 'animations/src/lib']) assert.ok(lines.includes(l), l);
  assert.ok(!lines.some((l) => l.endsWith('.html')));
});

test('template Makefile is self-contained and comments every target', () => {
  assert.ok(!fs.existsSync(path.join(tplRoot, 'canvas-commons.mk')));
  const mk = read('Makefile');
  assert.doesNotMatch(mk, /^include\b|cc-|CC_/m);
  const lines = mk.split('\n');
  for (const t of ['all', 'install', 'anim', 'force-build', 'serve', 'quarto', 'preview', 'publish', 'clean']) {
    const at = lines.findIndex((l) => l.startsWith(`${t}:`));
    assert.ok(at > 0, `target ${t}`);
    assert.match(lines[at - 1], /^# /, `${t} has a comment above it`);
  }
});

test('skill docs no longer tell anyone to render smoke.qmd', () => {
  const skill = path.join(repo, 'skills', 'motion-canvas-scene');
  for (const f of ['SKILL.md', 'references/bootstrap.md', 'references/project-architecture.md']) {
    assert.doesNotMatch(fs.readFileSync(path.join(skill, f), 'utf8'), /render smoke\.qmd|(?<![\w-])smoke\.html|QMD_FILE = smoke/, f);
  }
});

test('template animations build owns dist/animations and empties it on rebuild', () => {
  const cfg = read('animations/vite.config.ts');
  assert.match(cfg, /outDir:\s*"\.\.\/dist\/animations"/);
  assert.match(cfg, /emptyOutDir:\s*true/);
  assert.doesNotMatch(cfg, /\bdir:\s*"/, 'no second output dir in rollupOptions.output');
  assert.match(read('vite.player.config.ts'), /emptyOutDir:\s*false/, 'the player build must not wipe dist/animations');
});

test('template animations config keeps asset URLs relative and pre-bundles for top-level await', () => {
  const cfg = read('animations/vite.config.ts');
  assert.match(cfg, /base:\s*"\.\/"/, 'imported images must not resolve from the site root');
  assert.match(cfg, /optimizeDeps:\s*\{\s*esbuildOptions:\s*\{\s*target:\s*"esnext"/, 'yoga-layout needs top-level await in the dev server');
});

test('smoke scene imports an svg from src/assets, so a wrong vite base is caught', () => {
  assert.match(read('animations/src/assets/smoke.svg'), /<circle/);
  assert.match(read('animations/src/scenes/smoke.tsx'), /import dot from '\.\.\/assets\/smoke\.svg'/);
});

test('template deck publishes dist recursively, so deployed decks get dist/animations/src', () => {
  assert.match(read('deck.qmd'), /^\s+- dist\/\*\*$/m);
  assert.doesNotMatch(read('deck.qmd'), /dist\/\*\/\*/);
});

test('template deck has nothing between the YAML and the first slide heading (it would become an empty slide)', () => {
  const body = read('deck.qmd').split(/^---$/m)[2];
  assert.match(body, /^\s*## /);
});
