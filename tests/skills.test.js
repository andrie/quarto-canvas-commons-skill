const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const skillsDir = path.join(__dirname, '..', 'skills');
const skills = fs.readdirSync(skillsDir).filter(d =>
  fs.existsSync(path.join(skillsDir, d, 'SKILL.md')));

function frontmatter(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, `${file} has no frontmatter`);
  return Object.fromEntries(m[1].split('\n').map(l => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
}

for (const name of skills) {
  test(`${name}: name matches folder and description is a trigger`, () => {
    const fm = frontmatter(path.join(skillsDir, name, 'SKILL.md'));
    assert.strictEqual(fm.name, name);
    assert.match(fm.description, /^Use when /);
  });
}

test('motion-canvas-review exists and links its reference file', () => {
  assert.ok(skills.includes('motion-canvas-review'));
  const dir = path.join(skillsDir, 'motion-canvas-review');
  const body = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const link = 'references/positron-scene-review.md';
  assert.ok(body.includes(link));
  assert.ok(fs.existsSync(path.join(dir, link)));
});

test('new prose has no em-dashes', () => {
  const dir = path.join(skillsDir, 'motion-canvas-review');
  for (const f of ['SKILL.md', 'references/positron-scene-review.md']) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) assert.ok(!fs.readFileSync(p, 'utf8').includes('—'), f);
  }
});
