#!/usr/bin/env node
// Bring a project that was set up by an older version of this skill up to date.
//
// usage: upgrade-project.js [--root DIR] [--apply] [--replace-extension] [--remove-legacy]
//   (no flags)           print the plan and change nothing
//   --apply              do the safe steps: replace an untouched older extension, replace the
//                        Makefile rules block, wrap an unmarked Makefile that matches a known
//                        template, drop the stale built player in dist/
//   --replace-extension  also replace an extension copy the user has edited (ask first)
//   --remove-legacy      also delete the old root player build and the old script tag (ask first)
//   --rename-shortcode   also rewrite {{< motion-canvas >}} to {{< canvas-commons >}} in the decks
//
// The script never edits a file it cannot recognise. Those cases print a "decide:" line.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const templateDir = path.join(here, '../assets/project-template');
const EXT = '_extensions/andrie/canvas-commons';
const OLD_EXT = '_extensions/andrie/motion-canvas';
const BLOCK = /^# >>> canvas-commons[^\n]*\n[\s\S]*?^# <<< canvas-commons[^\n]*(\n|$)/m;
const OLD_TAG = /^[ \t]*-[ \t]*text:[ \t]*<script src="\.\/dist\/motion-canvas-ts\.js"><\/script>[ \t]*$/;

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function walk(dir, base = dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  }).sort();
}

// A hash of a folder's names and contents, so two copies compare equal wherever they sit.
export function hashDir(dir) {
  const h = crypto.createHash('sha256');
  for (const f of walk(dir)) h.update(`${f}\0${read(path.join(dir, f)).replace(/\r\n/g, '\n')}\0`);
  return h.digest('hex');
}

// The deck name and port are the user's, so they are masked before comparing Makefiles.
export function normaliseMakefile(text) {
  return text.replace(/\r\n/g, '\n').replace(/^QMD_FILE = .*$/m, 'QMD_FILE = @').replace(/^PORT = .*$/m, 'PORT = @');
}
export const hashText = (text) => crypto.createHash('sha256').update(text).digest('hex');

export function loadKnownCopies() {
  return JSON.parse(read(path.join(here, 'known-copies.json')));
}

const extensionVersion = (dir) => read(path.join(dir, '_extension.yml')).match(/^version:\s*(\S+)/m)?.[1];

function deckFiles(root) {
  return fs.readdirSync(root).filter((f) => /\.qmd$/.test(f) || f === '_quarto.yml' || f === '_metadata.yml');
}

// Remove the old script tag, and the include-in-header key if that leaves it empty.
function stripOldTag(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const out = [];
  let removed = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!OLD_TAG.test(lines[i])) { out.push(lines[i]); continue; }
    removed++;
  }
  // drop an `include-in-header:` key whose list is now empty
  for (let i = out.length - 1; i >= 0; i--) {
    const m = out[i].match(/^([ \t]*)include-in-header:[ \t]*$/);
    if (!m) continue;
    const next = out.slice(i + 1).find((l) => l.trim() !== '');
    const nextIndent = next?.match(/^[ \t]*/)[0].length ?? -1;
    if (next === undefined || nextIndent <= m[1].length) out.splice(i, 1);
  }
  return {text: out.join(eol), removed};
}

export function upgrade(root, {apply = false, replaceExtension = false, removeLegacy = false, renameShortcode = false} = {}) {
  const log = [];
  const say = (kind, msg) => log.push(`${kind}: ${msg}`);
  const known = loadKnownCopies();
  const tplExt = path.join(templateDir, EXT);
  const tplMake = read(path.join(templateDir, 'Makefile'));
  const tplVersion = extensionVersion(tplExt);
  let pending = 0;
  let decisions = 0;

  if (!exists(path.join(root, 'animations'))) {
    say('decide', 'no animations/ folder, so this is not a Canvas Commons project: use bootstrap.md instead');
    return {log, pending, decisions: 1};
  }

  // 1. The extension. It was called motion-canvas before 0.4.0, and the two folders must not coexist:
  // both would define the player.
  const projExt = path.join(root, EXT);
  const oldExt = path.join(root, OLD_EXT);
  const tplHash = hashDir(tplExt);
  const copyExt = () => {
    fs.rmSync(projExt, {recursive: true, force: true});
    fs.mkdirSync(path.dirname(projExt), {recursive: true});
    fs.cpSync(tplExt, projExt, {recursive: true});
  };
  const removeOld = () => fs.rmSync(oldExt, {recursive: true, force: true});
  const classify = (dir) => {
    const h = hashDir(dir);
    return h === tplHash ? {state: 'current'} : known.extension[h] ? {state: 'known', label: known.extension[h]} : {state: 'modified'};
  };
  const editedNote = (dir) => `has been edited (version ${extensionVersion(dir) ?? 'unknown'}). Review it against ${tplExt} before replacing: a fix of yours may already be in the template`;

  if (exists(projExt)) {
    const c = classify(projExt);
    if (c.state === 'current') say('ok', `extension is current (${tplVersion})`);
    else if (c.state === 'known') {
      say('upgrade', `extension is an older copy (${c.label}): replace it with ${tplVersion}`);
      pending++;
      if (apply) { copyExt(); say('done', `replaced the extension with ${tplVersion}`); pending--; }
    } else {
      say('decide', `the extension in ${EXT} ${editedNote(projExt)}`);
      pending++;
      if (apply && replaceExtension) { copyExt(); say('done', 'replaced the edited extension, as asked'); pending--; }
      else decisions++;
    }
    if (exists(oldExt)) {
      const o = classify(oldExt);
      if (o.state === 'modified' && !(apply && replaceExtension)) {
        say('decide', `${OLD_EXT} still exists next to ${EXT}, and it ${editedNote(oldExt)}. Two copies define the player twice`);
        pending++; decisions++;
      } else {
        say('upgrade', `${OLD_EXT} is the extension's old name and must go: ${EXT} replaces it`);
        pending++;
        if (apply) { removeOld(); say('done', `removed ${OLD_EXT}`); pending--; }
      }
    }
  } else if (exists(oldExt)) {
    const o = classify(oldExt);
    if (o.state === 'modified') {
      say('decide', `the extension in ${OLD_EXT} ${editedNote(oldExt)}. It is now ${EXT}`);
      pending++;
      if (apply && replaceExtension) { removeOld(); copyExt(); say('done', `replaced the edited extension with ${EXT}, as asked`); pending--; }
      else decisions++;
    } else {
      say('upgrade', `extension ${OLD_EXT} (${o.label ?? tplVersion}) is now ${EXT} ${tplVersion}: replace it`);
      pending++;
      if (apply) { removeOld(); copyExt(); say('done', `replaced ${OLD_EXT} with ${EXT} ${tplVersion}`); pending--; }
    }
  } else {
    say('upgrade', `the extension is missing: copy it from the template (version ${tplVersion})`);
    pending++;
    if (apply) { copyExt(); say('done', 'copied the extension'); pending--; }
  }

  // 2. The Makefile
  const makePath = path.join(root, 'Makefile');
  const tplBlock = tplMake.match(BLOCK)[0];
  if (!exists(makePath)) say('ok', 'no Makefile (nothing to upgrade there)');
  else {
    const text = read(makePath);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const block = text.match(BLOCK);
    if (block) {
      if (block[0].replace(/\r\n/g, '\n') === tplBlock) say('ok', `Makefile rules block is current (${tplVersion})`);
      else {
        const was = block[0].match(/^# >>> canvas-commons (\S+)/)?.[1] ?? 'unknown';
        say('upgrade', `Makefile rules block is ${was}: replace it with ${tplVersion}`);
        pending++;
        if (apply) {
          fs.writeFileSync(makePath, text.replace(BLOCK, () => tplBlock.replace(/\n/g, eol)));
          say('done', 'replaced the Makefile rules block');
          pending--;
        }
      }
    } else if (known.makefile[hashText(normaliseMakefile(text))]) {
      const label = known.makefile[hashText(normaliseMakefile(text))];
      say('upgrade', `Makefile is an unedited older template (${label}): rewrite it from the template, keeping your deck name and port`);
      pending++;
      if (apply) {
        const qmd = text.match(/^QMD_FILE = .*$/m)[0];
        const port = text.match(/^PORT = .*$/m)?.[0] ?? 'PORT = 4200';
        const next = tplMake.replace(/^QMD_FILE = .*$/m, () => qmd).replace(/^PORT = .*$/m, () => port);
        fs.writeFileSync(makePath, next.replace(/\n/g, eol));
        say('done', 'rewrote the Makefile from the template');
        pending--;
      }
    } else if (/canvas-commons|anim:|\.build-complete|build:player/.test(text)) {
      say('decide', 'the Makefile has Canvas Commons rules without the managed markers, and it differs from every known template. Follow "Upgrading a Makefile by hand" in references/upgrade.md');
      pending++; decisions++;
    } else say('ok', 'Makefile has no Canvas Commons rules (nothing to upgrade there)');
  }

  if (exists(path.join(root, 'canvas-commons.mk')) && !(exists(makePath) && /^-?include\s+canvas-commons\.mk/m.test(read(makePath)))) {
    say('decide', 'canvas-commons.mk is not included by the Makefile, so it is probably left over from an older template: delete it if you do not use it');
    decisions++;
  }

  // 3. The old root player build
  const legacy = [];
  const rootPkgPath = path.join(root, 'package.json');
  const ownFile = {
    'vite.player.config.ts': (t) => /motion-canvas-ts\.html/.test(t),
    'motion-canvas-ts.html': (t) => /src\/main\.ts/.test(t),
    'src/main.ts': (t) => t.replace(/\s+/g, ' ').trim() === "import '@canvas-commons/core'; import '@canvas-commons/player';",
  };
  for (const [f, isOurs] of Object.entries(ownFile)) {
    const p = path.join(root, f);
    if (!exists(p)) continue;
    if (isOurs(read(p))) legacy.push({file: f, remove: () => fs.rmSync(p)});
    else say('decide', `${f} exists but is not the template's player build: left alone`);
  }
  if (exists(rootPkgPath)) {
    const pkg = JSON.parse(read(rootPkgPath));
    if (pkg.scripts?.['build:player'] === 'vite build -c vite.player.config.ts') {
      legacy.push({
        file: 'package.json (the build:player script)',
        remove: () => {
          const only = pkg.name === 'canvas-commons-presentation' && Object.keys(pkg.scripts).length === 1;
          if (only) fs.rmSync(rootPkgPath);
          else {
            delete pkg.scripts['build:player'];
            if (Object.keys(pkg.scripts).length === 0) delete pkg.scripts;
            const text = read(rootPkgPath);
            const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '  ';
            fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, indent) + (text.endsWith('\n') ? '\n' : ''));
          }
        },
        note: pkg.name === 'canvas-commons-presentation' ? '' : ' (its dependencies stay: remove @canvas-commons/* and vite yourself if nothing else uses them)',
      });
    }
  }
  for (const f of deckFiles(root)) {
    const text = read(path.join(root, f));
    if (text.split(/\r?\n/).some((l) => OLD_TAG.test(l))) {
      legacy.push({file: `${f} (the script tag for dist/motion-canvas-ts.js)`, remove: () => {
        fs.writeFileSync(path.join(root, f), stripOldTag(text).text);
      }});
    } else if (/<script[^>]*motion-canvas-ts\.js/.test(text)) {
      say('decide', `${f} mentions motion-canvas-ts.js in a form this script does not recognise: remove that script tag by hand`);
      decisions++;
    }
  }
  if (legacy.length === 0) say('ok', 'no old root player build or script tag');
  for (const item of legacy) {
    say('remove', `${item.file}: the extension ships the player now${item.note ?? ''}`);
    pending++;
    if (apply && removeLegacy) { item.remove(); say('done', `removed ${item.file}`); pending--; }
    else decisions++;
  }
  if (apply && removeLegacy && exists(path.join(root, 'src')) && fs.readdirSync(path.join(root, 'src')).length === 0) fs.rmdirSync(path.join(root, 'src'));
  if (!exists(rootPkgPath) && (exists(path.join(root, 'package-lock.json')) || exists(path.join(root, 'node_modules')))) {
    say('note', 'the root package-lock.json and node_modules/ belonged to the old player build and are no longer used: delete them when you are ready');
  }

  // 4. Stale built player in dist/ (build output, safe to delete)
  const stale = ['dist/motion-canvas-ts.js', 'dist/motion-canvas-ts.html', 'dist/.build-complete'].filter((f) => exists(path.join(root, f)));
  if (stale.length) {
    say('upgrade', `stale build output from the old player build: ${stale.join(', ')}`);
    pending++;
    if (apply) { for (const f of stale) fs.rmSync(path.join(root, f)); say('done', 'deleted the stale build output'); pending--; }
  }

  // 5. Decks that still use the old shortcode name (it works, with a warning)
  const OLD_SHORTCODE = /(?<!\{)\{\{<\s*motion-canvas\b/g;
  for (const f of deckFiles(root).filter((n) => n.endsWith('.qmd'))) {
    const text = read(path.join(root, f));
    if (!OLD_SHORTCODE.test(text)) continue;
    OLD_SHORTCODE.lastIndex = 0;
    if (apply && renameShortcode) {
      fs.writeFileSync(path.join(root, f), text.replace(OLD_SHORTCODE, (m) => m.replace('motion-canvas', 'canvas-commons')));
      say('done', `${f}: renamed the {{< motion-canvas >}} shortcodes to {{< canvas-commons >}}`);
    } else say('note', `${f} still uses {{< motion-canvas >}}, which works but warns: --rename-shortcode updates it`);
  }
  OLD_SHORTCODE.lastIndex = 0;

  // 6. Report, never change: a deck that uses the shortcode but would lose its scenes when published
  const projectYaml = ['_quarto.yml', '_metadata.yml'].filter((f) => exists(path.join(root, f))).map((f) => read(path.join(root, f)));
  const projectHasResources = projectYaml.some((t) => /dist\/\*\*/.test(t));
  for (const f of deckFiles(root).filter((n) => n.endsWith('.qmd'))) {
    const text = read(path.join(root, f));
    if (/\{\{<\s*motion-canvas/.test(text) && !/dist\/\*\*/.test(text) && !projectHasResources) {
      say('decide', `${f} uses the shortcode but has no "resources: dist/**" entry, so a published deck loses its scenes: see "Patching an existing deck's YAML" in references/bootstrap.md`);
      decisions++;
    }
  }
  return {log, pending, decisions};
}

function main(argv) {
  const opt = (name) => argv.includes(name);
  const i = argv.indexOf('--root');
  const root = path.resolve(i >= 0 ? argv[i + 1] : '.');
  const {log, pending, decisions} = upgrade(root, {
    apply: opt('--apply'),
    replaceExtension: opt('--replace-extension'),
    removeLegacy: opt('--remove-legacy'),
    renameShortcode: opt('--rename-shortcode'),
  });
  for (const line of log) console.log(line);
  if (pending === 0 && decisions === 0) console.log('up to date');
  else if (!opt('--apply')) console.log(`${pending} upgrade step(s) pending; run again with --apply${decisions ? ' (some need your decision first)' : ''}`);
  else console.log(`${pending} step(s) pending, ${decisions} item(s) need your decision`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main(process.argv.slice(2));
