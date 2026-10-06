import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  parseArgs, slideHash, pngName, playwrightCandidates, resolvePlaywright,
  missingPlaywrightMessage, libasoundMessage, browserLibraryPath, serveDirectory, UsageError,
} from '../skills/motion-canvas-scene/scripts/screenshot-slide.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, '../skills/motion-canvas-scene/scripts/screenshot-slide.mjs');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));

test('parseArgs reads every option', () => {
  const o = parseArgs(['talk.html', '--slide', '3', '--at', '0.5, 2,4', '--out', 'shots', '--width', '1280', '--height', '720', '--timeout', '10', '--playwright', '/opt/pw']);
  assert.deepEqual(o, {deck: 'talk.html', slide: 3, at: [0.5, 2, 4], out: 'shots', width: 1280, height: 720, timeout: 10, playwright: '/opt/pw'});
});

test('parseArgs defaults to slide 1 at 0.5, 2 and 4 seconds in 1920x1080', () => {
  const o = parseArgs(['talk.html']);
  assert.equal(o.slide, 1);
  assert.deepEqual(o.at, [0.5, 2, 4]);
  assert.equal(o.width, 1920);
  assert.equal(o.height, 1080);
});

test('parseArgs rejects bad input', () => {
  for (const argv of [[], ['talk.qmd'], ['a.html', 'b.html'], ['a.html', '--slide', '0'], ['a.html', '--slide', '1.5'], ['a.html', '--slide'], ['a.html', '--at', '1,x'], ['a.html', '--at', '-1'], ['a.html', '--bogus']]) {
    assert.throws(() => parseArgs(argv), UsageError, argv.join(' '));
  }
});

test('slide numbers are 1-based and the hash is 0-based', () => {
  assert.equal(slideHash(1), '#/0');
  assert.equal(slideHash(2), '#/1');
});

test('PNG names carry the deck, slide and offset', () => {
  assert.equal(pngName('/p/talk.html', 2, 0.5), 'talk-slide2-t0.5.png');
  assert.equal(pngName('talk.html', 2, 3), 'talk-slide2-t3.png');
});

test('playwright is looked up in --playwright, then PLAYWRIGHT_DIR, then the tools dir', () => {
  assert.deepEqual(playwrightCandidates({flag: '/a', env: {PLAYWRIGHT_DIR: '/b'}, toolsDir: '/c'}), ['/a', '/b', '/c']);
  assert.deepEqual(playwrightCandidates({env: {}, toolsDir: '/c'}), ['/c']);
  assert.equal(playwrightCandidates({flag: '~/x', env: {}, toolsDir: '/c'})[0], path.join(os.homedir(), 'x'));
});

test('resolvePlaywright finds a node_modules/playwright and skips directories without one', () => {
  const empty = tmp();
  const withPw = tmp();
  fs.mkdirSync(path.join(withPw, 'node_modules/playwright'), {recursive: true});
  fs.writeFileSync(path.join(withPw, 'node_modules/playwright/package.json'), '{"name":"playwright","main":"index.js"}');
  fs.writeFileSync(path.join(withPw, 'node_modules/playwright/index.js'), '');
  assert.equal(resolvePlaywright([empty]), null);
  assert.equal(resolvePlaywright([empty, withPw]), path.join(withPw, 'node_modules/playwright/index.js'));
});

test('the setup and libasound messages give the exact commands', () => {
  assert.match(missingPlaywrightMessage(['/x']), /mkdir -p ~\/\.cache\/canvas-commons-tools && cd ~\/\.cache\/canvas-commons-tools && npm init -y && npm i playwright && npx playwright install chromium/);
  const m = libasoundMessage('/tools');
  assert.match(m, /apt-get download libasound2t64 \|\| apt-get download libasound2/);
  assert.match(m, /dpkg -x libasound2\*\.deb \/tools\/libasound/);
  assert.match(m, /LD_LIBRARY_PATH/);
});

test('browserLibraryPath keeps the caller\'s LD_LIBRARY_PATH and adds an unpacked libasound', () => {
  const tools = tmp();
  assert.equal(browserLibraryPath({LD_LIBRARY_PATH: '/mine'}, tools), '/mine');
  const lib = path.join(tools, 'libasound/usr/lib/x86_64-linux-gnu');
  fs.mkdirSync(lib, {recursive: true});
  fs.writeFileSync(path.join(lib, 'libasound.so.2'), '');
  assert.equal(browserLibraryPath({LD_LIBRARY_PATH: '/mine'}, tools), `/mine:${lib}`);
  assert.equal(browserLibraryPath({}, tools), lib);
});

test('the built-in server serves the deck directory with JS MIME types and refuses to leave it', async () => {
  const dir = tmp();
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist/a.js'), 'export {}');
  const {server, port} = await serveDirectory(dir);
  try {
    const ok = await fetch(`http://127.0.0.1:${port}/dist/a.js`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('content-type'), 'text/javascript');
    assert.equal((await fetch(`http://127.0.0.1:${port}/nope.js`)).status, 404);
    assert.equal((await fetch(`http://127.0.0.1:${port}/..%2f..%2f..%2fetc%2fpasswd`)).status, 403);
  } finally {
    server.close();
  }
});

test('the CLI prints setup instructions and exits 2 when playwright is missing', () => {
  const home = tmp();
  const deck = path.join(home, 'talk.html');
  fs.writeFileSync(deck, '<html></html>');
  const r = spawnSync('node', [script, deck, '--slide', '2'], {encoding: 'utf8', env: {...process.env, HOME: home, PLAYWRIGHT_DIR: path.join(home, 'none')}, cwd: home});
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /playwright not found/);
  assert.match(r.stderr, /npm i playwright && npx playwright install chromium/);
});

test('the CLI prints usage and exits 1 on bad arguments', () => {
  const r = spawnSync('node', [script, '--slide', 'two'], {encoding: 'utf8'});
  assert.equal(r.status, 1);
  assert.match(r.stderr, /usage: screenshot-slide\.mjs/);
});

const browserSkip = process.env.CC_BROWSER_TESTS === '1' ? false : 'set CC_BROWSER_TESTS=1 (and PLAYWRIGHT_DIR if playwright is not in ~/.cache/canvas-commons-tools) to run';

test('browser: screenshots of a playing slide at two offsets differ', {skip: browserSkip}, () => {
  const out = tmp();
  const deck = path.join(here, 'fixtures/screenshot/fake-deck.html');
  const r = spawnSync('node', [script, deck, '--slide', '2', '--at', '0.2,1.2', '--out', out, '--width', '320', '--height', '180'], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  const files = ['fake-deck-slide2-t0.2.png', 'fake-deck-slide2-t1.2.png'].map((f) => path.join(out, f));
  for (const f of files) assert.ok(r.stdout.includes(f), `prints ${f}`);
  const [a, b] = files.map((f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
  assert.notEqual(a, b, 'the animation moved between the two shots');
});

test('browser: a slide number past the end fails clearly', {skip: browserSkip}, () => {
  const r = spawnSync('node', [script, path.join(here, 'fixtures/screenshot/fake-deck.html'), '--slide', '9', '--out', tmp()], {encoding: 'utf8'});
  assert.equal(r.status, 4);
  assert.match(r.stderr, /slide 9 does not exist: the deck has 2 horizontal slides/);
});
