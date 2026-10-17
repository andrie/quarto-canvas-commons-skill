import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = (f) => JSON.parse(fs.readFileSync(path.join(repo, f), 'utf8'));

test('the plugin manifest and the marketplace entry agree', () => {
  const plugin = json('.claude-plugin/plugin.json');
  const market = json('.claude-plugin/marketplace.json');
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assert.equal(market.plugins.length, 1);
  assert.equal(market.plugins[0].name, plugin.name);
  assert.equal(market.plugins[0].source, '.');
  assert.match(fs.readFileSync(path.join(repo, 'CHANGELOG.md'), 'utf8'), new RegExp(`^## ${plugin.version.replace(/\./g, '\\.')}\\b`, 'm'), 'the changelog has an entry for the plugin version');
});

test('every skill folder with a SKILL.md is under skills/, where the plugin finds it', () => {
  const dirs = fs.readdirSync(path.join(repo, 'skills'), {withFileTypes: true}).filter((d) => d.isDirectory());
  const skills = dirs.filter((d) => fs.existsSync(path.join(repo, 'skills', d.name, 'SKILL.md')));
  assert.ok(skills.length >= 6);
});

test('SKILL.md files do not hard-code the symlink install location', () => {
  for (const d of fs.readdirSync(path.join(repo, 'skills'))) {
    const f = path.join(repo, 'skills', d, 'SKILL.md');
    if (!fs.existsSync(f)) continue;
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /~\/\.claude\/skills/, `${d}/SKILL.md must work from a plugin install too`);
  }
});
