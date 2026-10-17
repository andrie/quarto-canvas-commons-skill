#!/usr/bin/env node
// Record the template's extension and Makefile in known-copies.json, so the upgrade script can tell
// an untouched older copy (safe to replace) from one the user edited.
//
// usage: record-known-copies.js [--rev <git rev> --label <text>]... [--extension-dir DIR --label <text>]
//   with no options: record the template as it is now, labelled with the extension version
//   --rev REV --label TEXT         record the template as it was at REV
//   --extension-dir DIR --label T  record a loose extension folder, such as a pre-fork copy
//
// Entries are only ever added. Run with no options when you release a change to the extension or the
// Makefile block: a test fails until the current copy is recorded.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hashDir, hashText, normaliseMakefile, loadKnownCopies, templateDir} from '../skills/motion-canvas-scene/scripts/upgrade-project.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tplRel = 'skills/motion-canvas-scene/assets/project-template';
const outPath = path.join(repo, 'skills/motion-canvas-scene/scripts/known-copies.json');
const EXT = '_extensions/andrie/motion-canvas';

const known = fs.existsSync(outPath) ? loadKnownCopies() : {extension: {}, makefile: {}};
const add = (kind, hash, label) => {
  if (known[kind][hash]) return console.log(`already recorded (${kind}): ${known[kind][hash]}`);
  known[kind][hash] = label;
  console.log(`recorded (${kind}): ${label}`);
};
const version = (dir) => fs.readFileSync(path.join(dir, '_extension.yml'), 'utf8').match(/^version:\s*(\S+)/m)[1];

function recordRev(rev, label) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-known-'));
  try {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', rev, '--', `${tplRel}/${EXT}`], {cwd: repo, encoding: 'utf8'}).split('\n').filter(Boolean);
    for (const f of files) {
      const dest = path.join(tmp, EXT, path.relative(`${tplRel}/${EXT}`, f));
      fs.mkdirSync(path.dirname(dest), {recursive: true});
      fs.writeFileSync(dest, execFileSync('git', ['show', `${rev}:${f}`], {cwd: repo, maxBuffer: 1 << 26}));
    }
    if (files.length) add('extension', hashDir(path.join(tmp, EXT)), label);
    const mk = execFileSync('git', ['show', `${rev}:${tplRel}/Makefile`], {cwd: repo, encoding: 'utf8'});
    add('makefile', hashText(normaliseMakefile(mk)), label);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

const argv = process.argv.slice(2);
const pairs = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--rev') pairs.push({rev: argv[i + 1], label: argv[i + 3]}), i += 3;
  else if (argv[i] === '--extension-dir') pairs.push({dir: argv[i + 1], label: argv[i + 3]}), i += 3;
}
if (pairs.length === 0) {
  const ext = path.join(templateDir, EXT);
  const label = `${version(ext)} (current template)`;
  add('extension', hashDir(ext), label);
  add('makefile', hashText(normaliseMakefile(fs.readFileSync(path.join(templateDir, 'Makefile'), 'utf8'))), label);
}
for (const p of pairs) p.rev ? recordRev(p.rev, p.label) : add('extension', hashDir(p.dir), p.label);

fs.writeFileSync(outPath, JSON.stringify(known, null, 2) + '\n');
