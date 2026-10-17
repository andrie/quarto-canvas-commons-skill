#!/usr/bin/env node
// Refresh the skill's project template from a checkout of the quarto-canvas-commons repo, where the
// extension and the starter project are edited. The template here is a generated copy: never edit it by hand.
//
// usage: sync-extension.js (--from DIR | --tag TAG [--repo URL]) [--to DIR] [--check]
//   --from DIR   a checkout of quarto-canvas-commons
//   --tag TAG    clone that tag from GitHub into a temporary folder instead
//   --to DIR     the template to refresh (default: the one in this repo)
//   --check      change nothing; exit 1 if the template differs from the source (for CI)
//
// Files the skill owns are left alone: see OWNED.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultTo = path.join(repo, 'skills/motion-canvas-scene/assets/project-template');
const DEFAULT_REPO = 'https://github.com/andrie/quarto-canvas-commons.git';
// animations/src/styles.ts is a snapshot of skills/canvas-commons-library/styles.ts, which this repo owns.
export const OWNED = ['animations/src/styles.ts'];
const SKIP = new Set(['node_modules', 'dist', '.git']);

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  }).sort();
}
const same = (a, b) => fs.existsSync(b) && Buffer.compare(fs.readFileSync(a), fs.readFileSync(b)) === 0;

export function sync(from, to, {check = false} = {}) {
  const srcTpl = path.join(from, 'template');
  const srcExt = path.join(from, '_extensions');
  if (!fs.existsSync(srcTpl) || !fs.existsSync(srcExt)) throw new Error(`${from} has no template/ and _extensions/: is it a quarto-canvas-commons checkout?`);
  const extFiles = walk(srcExt);
  for (const f of extFiles) {
    if (!same(path.join(srcExt, f), path.join(srcTpl, '_extensions', f))) {
      throw new Error(`template/_extensions/${f} differs from _extensions/${f} in ${from}: run scripts/sync-template.sh there first`);
    }
  }

  const srcFiles = walk(srcTpl);
  const destFiles = walk(to);
  const changes = [];
  for (const f of destFiles) {
    if (!srcFiles.includes(f) && !OWNED.includes(f)) changes.push({kind: 'remove', file: f});
  }
  for (const f of srcFiles) {
    if (OWNED.includes(f)) continue;
    const dest = path.join(to, f);
    if (!fs.existsSync(dest)) changes.push({kind: 'add', file: f});
    else if (!same(path.join(srcTpl, f), dest)) changes.push({kind: 'update', file: f});
  }
  if (!check) {
    for (const c of changes) {
      const dest = path.join(to, c.file);
      if (c.kind === 'remove') fs.rmSync(dest);
      else {
        fs.mkdirSync(path.dirname(dest), {recursive: true});
        fs.copyFileSync(path.join(srcTpl, c.file), dest);
      }
    }
    // drop folders the removals emptied
    for (const dir of [...new Set(changes.filter((c) => c.kind === 'remove').map((c) => path.dirname(c.file)))].sort().reverse()) {
      for (let d = path.join(to, dir); d !== to && fs.existsSync(d) && fs.readdirSync(d).length === 0; d = path.dirname(d)) fs.rmdirSync(d);
    }
  }
  return changes;
}

function sourceInfo(from, repoUrl) {
  const git = (...args) => execFileSync('git', ['-C', from, ...args], {encoding: 'utf8'}).trim();
  const version = fs.readFileSync(path.join(from, '_extensions/andrie/canvas-commons/_extension.yml'), 'utf8').match(/^version:\s*(\S+)/m)[1];
  let commit = null;
  let dirty = false;
  try {
    commit = git('rev-parse', 'HEAD');
    dirty = git('status', '--porcelain').length > 0;
  } catch { /* not a git checkout */ }
  return {repo: repoUrl, version, commit, dirty};
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const check = argv.includes('--check');
  const to = path.resolve(arg('--to') ?? defaultTo);
  let from = arg('--from');
  let tmp;
  if (!from && arg('--tag')) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-ext-src-'));
    execFileSync('git', ['-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1', '--branch', arg('--tag'), arg('--repo') ?? DEFAULT_REPO, tmp], {stdio: 'inherit'});
    from = tmp;
  }
  if (!from) { console.error('usage: sync-extension.js (--from DIR | --tag TAG) [--to DIR] [--check]'); process.exit(2); }
  from = path.resolve(from);
  try {
    const changes = sync(from, to, {check});
    for (const c of changes) console.log(`${check ? 'differs' : c.kind}: ${c.file}`);
    const info = sourceInfo(from, arg('--repo') ?? DEFAULT_REPO);
    if (check) {
      console.log(changes.length ? `${changes.length} file(s) differ from ${info.version}` : `ok: the template matches ${info.version}`);
      process.exit(changes.length ? 1 : 0);
    }
    if (info.dirty) console.warn('warning: the source checkout has uncommitted changes, so the recorded commit does not describe what was copied');
    fs.writeFileSync(path.join(to, '..', 'extension-source.json'), JSON.stringify(info, null, 2) + '\n');
    console.log(changes.length ? `synced ${changes.length} file(s) from ${info.version}` : `already in sync with ${info.version}`);
  } finally {
    if (tmp) fs.rmSync(tmp, {recursive: true, force: true});
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main(process.argv.slice(2));
