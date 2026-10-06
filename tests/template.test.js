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
