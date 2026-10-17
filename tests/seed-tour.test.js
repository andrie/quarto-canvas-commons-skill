import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tour = path.join(repo, 'seed/tour');
const styles = fs.readFileSync(path.join(repo, 'skills/canvas-commons-library/styles.ts'), 'utf8');
const exported = new Set([...styles.matchAll(/export const (\w+)/g)].map((m) => m[1]));
const files = ['scenes', 'components'].flatMap((d) => fs.readdirSync(path.join(tour, d)).map((f) => path.join(tour, d, f)));

test('tour scenes import only names the shared styles file exports', () => {
  for (const f of files) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\.\/styles'/g)) {
      for (const name of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        assert.ok(exported.has(name), `${path.relative(tour, f)} imports ${name}, which styles.ts does not export`);
      }
    }
  }
});

test('tour relative imports resolve inside the tour, except the documented ones', () => {
  const external = new Set(['../styles', './RHighlighter']);
  for (const f of files) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/from\s*'(\.[^']+)'/g)) {
      const spec = m[1].replace(/\?raw$/, '');
      if (external.has(spec)) continue;
      const target = path.resolve(path.dirname(f), spec);
      assert.ok(['', '.ts', '.tsx'].some((e) => fs.existsSync(target + e)), `${path.relative(tour, f)} imports ${spec}, which is missing`);
    }
  }
});

test('every tour scene is listed in the tour README', () => {
  const readme = fs.readFileSync(path.join(tour, 'README.md'), 'utf8');
  for (const f of fs.readdirSync(path.join(tour, 'scenes'))) assert.ok(readme.includes(`\`${path.basename(f, '.tsx')}\``), f);
});
