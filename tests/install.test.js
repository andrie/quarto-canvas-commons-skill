const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
const script = path.join(repo, 'scripts', 'install.sh');
const skills = fs.readdirSync(path.join(repo, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name);
const expected = ['motion-canvas-api', 'motion-canvas-scene', 'motion-canvas-authoring',
  'svg-to-motion-canvas', 'motion-canvas-r-code', 'canvas-commons-library', 'motion-canvas-review'];

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'install-test-'));
}
function run(args, env = {}) {
  const home = tmp();
  return execFileSync('bash', [script, ...args], {
    encoding: 'utf8', env: { ...process.env, HOME: home, ...env },
  });
}
function resolves(link) {
  return fs.realpathSync(link) === fs.realpathSync(path.join(repo, 'skills', path.basename(link)));
}

test('repo contains the expected seven skill directories', () => {
  for (const s of expected) assert.ok(skills.includes(s), s);
});

test('creates a symlink for every skill dir', () => {
  const t = tmp();
  run(['--target', t]);
  for (const s of skills) {
    const p = path.join(t, s);
    assert.ok(fs.lstatSync(p).isSymbolicLink(), `${s} is a symlink`);
    assert.ok(resolves(p), `${s} points into repo`);
  }
});

test('re-run is idempotent', () => {
  const t = tmp();
  run(['--target', t]);
  const before = skills.map((s) => fs.readlinkSync(path.join(t, s)));
  run(['--target', t]);
  assert.deepStrictEqual(skills.map((s) => fs.readlinkSync(path.join(t, s))), before);
  assert.deepStrictEqual(fs.readdirSync(t).sort(), [...skills].sort());
});

test('skips a pre-existing real directory and leaves it untouched', () => {
  const t = tmp();
  const real = path.join(t, 'motion-canvas-api');
  fs.mkdirSync(real);
  fs.writeFileSync(path.join(real, 'keep.txt'), 'mine');
  const out = run(['--target', t]);
  assert.match(out, /SKIP motion-canvas-api/);
  assert.ok(!fs.lstatSync(real).isSymbolicLink());
  assert.strictEqual(fs.readFileSync(path.join(real, 'keep.txt'), 'utf8'), 'mine');
  assert.ok(fs.lstatSync(path.join(t, 'motion-canvas-scene')).isSymbolicLink());
});

test('skips a symlink that points elsewhere and leaves it', () => {
  const t = tmp();
  const elsewhere = tmp();
  fs.symlinkSync(elsewhere, path.join(t, 'motion-canvas-api'));
  const out = run(['--target', t]);
  assert.match(out, /SKIP motion-canvas-api: symlink points elsewhere/);
  assert.strictEqual(fs.readlinkSync(path.join(t, 'motion-canvas-api')), elsewhere);
  assert.ok(resolves(path.join(t, 'motion-canvas-scene')));
});

test('--force repoints a symlink that points elsewhere', () => {
  const t = tmp();
  const elsewhere = tmp();
  fs.symlinkSync(elsewhere, path.join(t, 'motion-canvas-api'));
  run(['--target', t, '--force']);
  assert.ok(resolves(path.join(t, 'motion-canvas-api')));
});

test('--dry-run creates nothing, not even the target', () => {
  const t = path.join(tmp(), 'does-not-exist');
  const out = run(['--dry-run', '--target', t]);
  assert.ok(!fs.existsSync(t));
  assert.match(out, /dry-run|would/i);
});

test('default target honours $HOME and --dry-run leaves HOME empty', () => {
  const home = tmp();
  execFileSync('bash', [script, '--dry-run'], { env: { ...process.env, HOME: home } });
  assert.deepStrictEqual(fs.readdirSync(home), []);
  execFileSync('bash', [script], { env: { ...process.env, HOME: home } });
  assert.ok(fs.lstatSync(path.join(home, '.claude', 'skills', 'motion-canvas-api')).isSymbolicLink());
});

test('missing skills/ dir fails clearly', () => {
  const copy = tmp();
  fs.mkdirSync(path.join(copy, 'scripts'));
  fs.copyFileSync(script, path.join(copy, 'scripts', 'install.sh'));
  const r = spawnSync('bash', [path.join(copy, 'scripts', 'install.sh'), '--target', tmp()], { encoding: 'utf8' });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /skills/);
});

test('unknown flag fails', () => {
  const r = spawnSync('bash', [script, '--bogus'], { encoding: 'utf8', env: { ...process.env, HOME: tmp() } });
  assert.notStrictEqual(r.status, 0);
});

test('--uninstall removes only links into this repo', () => {
  const t = tmp();
  run(['--target', t]);
  // replace three entries: a real dir, a foreign link, and keep the rest
  fs.rmSync(path.join(t, 'motion-canvas-api'));
  fs.mkdirSync(path.join(t, 'motion-canvas-api'));
  const foreign = tmp();
  fs.rmSync(path.join(t, 'motion-canvas-scene'));
  fs.symlinkSync(foreign, path.join(t, 'motion-canvas-scene'));
  run(['--uninstall', '--target', t]);
  assert.ok(fs.lstatSync(path.join(t, 'motion-canvas-api')).isDirectory());
  assert.ok(fs.lstatSync(path.join(t, 'motion-canvas-scene')).isSymbolicLink());
  assert.strictEqual(fs.readlinkSync(path.join(t, 'motion-canvas-scene')), foreign);
  for (const s of skills.filter((x) => !['motion-canvas-api', 'motion-canvas-scene'].includes(x))) {
    assert.throws(() => fs.lstatSync(path.join(t, s)), { code: 'ENOENT' }, s);
  }
});

test('--uninstall --dry-run removes nothing', () => {
  const t = tmp();
  run(['--target', t]);
  run(['--uninstall', '--dry-run', '--target', t]);
  assert.strictEqual(fs.readdirSync(t).length, skills.length);
});
