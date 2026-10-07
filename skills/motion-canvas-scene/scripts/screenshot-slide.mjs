#!/usr/bin/env node
// Screenshot one slide of a rendered Quarto revealjs deck at real-clock offsets after its
// Canvas Commons player starts playing. Needs Playwright, which is never added to the project:
// see `usage` below for where it is looked up.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

export const TOOLS_DIR = path.join(os.homedir(), '.cache', 'canvas-commons-tools');

export const usage = `usage: screenshot-slide.mjs <deck.html> [--slide <n>] [--at <s,s,...>] [--out <dir>]
                           [--width <px>] [--height <px>] [--timeout <s>] [--playwright <dir>]

  --slide       1-based slide number, counting the title slide (default 1); opens #/<n-1>
  --at          seconds after the player starts playing (default 0.5,2,4)
  --out         directory for the PNGs (default ${path.join(os.tmpdir(), 'canvas-commons-screenshots')})
  --width/--height   viewport in px (default 1920x1080)
  --timeout     seconds to wait for the player to load and start (default 30)
  --playwright  a directory whose node_modules has playwright; else $PLAYWRIGHT_DIR, else ${TOOLS_DIR}`;

export class UsageError extends Error {}

export function parseArgs(argv) {
  const opts = {slide: 1, at: [0.5, 2, 4], out: path.join(os.tmpdir(), 'canvas-commons-screenshots'), width: 1920, height: 1080, timeout: 30, playwright: undefined, deck: undefined};
  const num = (flag, v, {int = false, min = 0} = {}) => {
    const n = Number(v);
    if (v === undefined || v === '' || !Number.isFinite(n) || n < min || (int && !Number.isInteger(n))) throw new UsageError(`${flag} needs ${int ? 'an integer' : 'a number'} >= ${min}, got ${v ?? 'nothing'}`);
    return n;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    switch (a) {
      case '--slide': opts.slide = num(a, v, {int: true, min: 1}); i++; break;
      case '--at': {
        if (v === undefined) throw new UsageError('--at needs a list of seconds, such as 0.5,2,4');
        opts.at = v.split(',').map((s) => num(a, s.trim()));
        i++; break;
      }
      case '--out': if (!v) throw new UsageError('--out needs a directory'); opts.out = v; i++; break;
      case '--width': opts.width = num(a, v, {int: true, min: 1}); i++; break;
      case '--height': opts.height = num(a, v, {int: true, min: 1}); i++; break;
      case '--timeout': opts.timeout = num(a, v, {min: 1}); i++; break;
      case '--playwright': if (!v) throw new UsageError('--playwright needs a directory'); opts.playwright = v; i++; break;
      case '-h': case '--help': throw new UsageError('');
      default:
        if (a.startsWith('--')) throw new UsageError(`unknown option ${a}`);
        if (opts.deck) throw new UsageError(`more than one deck given: ${opts.deck} and ${a}`);
        opts.deck = a;
    }
  }
  if (!opts.deck) throw new UsageError('no deck given');
  if (!/\.html?$/i.test(opts.deck)) throw new UsageError(`the deck must be the rendered .html, not ${opts.deck}`);
  return opts;
}

// Reveal.js numbers horizontal slides from 0 in the URL hash, and Quarto's title slide is slide 0.
export const slideHash = (slide) => `#/${slide - 1}`;

export const pngName = (deck, slide, seconds) => `${path.basename(deck).replace(/\.html?$/i, '')}-slide${slide}-t${seconds}.png`;

// Candidate directories, in the order they are tried.
export function playwrightCandidates({flag, env = process.env, toolsDir = TOOLS_DIR} = {}) {
  return [flag, env.PLAYWRIGHT_DIR, toolsDir].filter(Boolean).map((d) => path.resolve(d.replace(/^~(?=$|\/)/, os.homedir())));
}

// Returns the resolved entry point of playwright, or null.
export function resolvePlaywright(candidates) {
  for (const dir of candidates) {
    try {
      return createRequire(path.join(dir, 'noop.js')).resolve('playwright');
    } catch { /* try the next one */ }
  }
  return null;
}

export function missingPlaywrightMessage(candidates) {
  return `screenshot-slide: playwright not found. Looked in:
${candidates.map((c) => `  ${c}`).join('\n')}

Install it once, outside any project, with:

  mkdir -p ~/.cache/canvas-commons-tools && cd ~/.cache/canvas-commons-tools && npm init -y && npm i playwright && npx playwright install chromium

or point --playwright (or PLAYWRIGHT_DIR) at a directory whose node_modules already has playwright.`;
}

export function libasoundMessage(toolsDir = TOOLS_DIR) {
  const dest = path.join(toolsDir, 'libasound');
  return `screenshot-slide: Chromium cannot start because libasound.so.2 is missing.
With sudo: sudo apt-get install libasound2t64 (libasound2 on older releases).
Without sudo, unpack the library where this script looks for it:

  tmp=$(mktemp -d) && cd "$tmp" && (apt-get download libasound2t64 || apt-get download libasound2) && dpkg -x libasound2*.deb ${dest} && cd - && rm -rf "$tmp"

The script adds ${dest}/usr/lib/<arch>-linux-gnu to LD_LIBRARY_PATH by itself. Elsewhere, set LD_LIBRARY_PATH to the directory holding libasound.so.2 before running it.`;
}

// LD_LIBRARY_PATH for the browser: the caller's value first, then the unpacked libasound, if any.
export function browserLibraryPath(env = process.env, toolsDir = TOOLS_DIR) {
  const parts = (env.LD_LIBRARY_PATH ?? '').split(':').filter(Boolean);
  const usrLib = path.join(toolsDir, 'libasound', 'usr', 'lib');
  if (fs.existsSync(usrLib)) {
    for (const d of fs.readdirSync(usrLib)) {
      const p = path.join(usrLib, d);
      if (fs.existsSync(path.join(p, 'libasound.so.2')) && !parts.includes(p)) parts.push(p);
    }
  }
  return parts.join(':');
}

const TYPES = {'.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.map': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg'};

// A static server for one directory. The player fetches the scene bundle, which file:// blocks.
export function serveDirectory(root) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(base, rel);
    if (file !== base && !file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, {'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream'}).end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({server, port: server.address().port})));
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    if (e.message) console.error(`screenshot-slide: ${e.message}`);
    console.error(usage);
    return 1;
  }
  const deck = path.resolve(opts.deck);
  if (!fs.existsSync(deck)) { console.error(`screenshot-slide: ${deck} does not exist (render the deck first)`); return 1; }

  const candidates = playwrightCandidates({flag: opts.playwright});
  const entry = resolvePlaywright(candidates);
  if (!entry) { console.error(missingPlaywrightMessage(candidates)); return 2; }
  const {chromium} = createRequire(import.meta.url)(entry);

  let browser;
  try {
    browser = await chromium.launch({env: {...process.env, LD_LIBRARY_PATH: browserLibraryPath()}});
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (/libasound\.so\.2/.test(msg)) console.error(libasoundMessage());
    else if (/Executable doesn't exist/.test(msg)) console.error(`screenshot-slide: playwright (${path.dirname(entry)}) has no matching Chromium. From the directory that holds its node_modules run:\n\n  npx playwright install chromium\n\n${msg.split('\n')[0]}`);
    else console.error(`screenshot-slide: Chromium failed to launch:\n${msg}`);
    return 3;
  }

  const {server, port} = await serveDirectory(path.dirname(deck));
  const written = [];
  try {
    const page = await browser.newPage({viewport: {width: opts.width, height: opts.height}});
    page.on('pageerror', (err) => console.error(`page error: ${err.message}`));
    page.on('console', (m) => { if (m.type() === 'error') console.error(`console error: ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(path.basename(deck))}${slideHash(opts.slide)}`);

    const timeout = opts.timeout * 1000;
    await page.waitForFunction(() => window.Reveal?.isReady?.(), null, {timeout}).catch(() => {
      throw new Error('Reveal.js never became ready: is this a rendered revealjs deck?');
    });
    const where = await page.evaluate(() => ({h: Reveal.getIndices().h, total: Reveal.getHorizontalSlides().length}));
    if (where.h !== opts.slide - 1) throw new Error(`slide ${opts.slide} does not exist: the deck has ${where.total} horizontal slides`);

    const hasPlayer = await page.evaluate(() => !!Reveal.getCurrentSlide().querySelector('canvas-commons-player'));
    if (hasPlayer) {
      await page.waitForFunction(() => {
        const el = Reveal.getCurrentSlide().querySelector('canvas-commons-player');
        return el.state === 'error' || (el.state === 'ready' && el.playing);
      }, null, {timeout}).catch(() => { throw new Error(`the player on slide ${opts.slide} did not start playing within ${opts.timeout}s`); });
      const state = await page.evaluate(() => Reveal.getCurrentSlide().querySelector('canvas-commons-player').state);
      if (state === 'error') throw new Error(`the player on slide ${opts.slide} is in its error state: check the shortcode src and dist/animations/src`);
    } else {
      const withPlayers = await page.evaluate(() => Reveal.getHorizontalSlides().flatMap((s, i) => (s.querySelector('canvas-commons-player') ? [i + 1] : [])));
      console.error(`warning: slide ${opts.slide} has no canvas-commons-player (slides with one: ${withPlayers.join(', ') || 'none'}); timing from when the slide is shown`);
    }

    fs.mkdirSync(opts.out, {recursive: true});
    const t0 = Date.now();
    for (const t of [...opts.at].sort((a, b) => a - b)) {
      await page.waitForTimeout(Math.max(0, t * 1000 - (Date.now() - t0)));
      const file = path.resolve(opts.out, pngName(deck, opts.slide, t));
      await page.screenshot({path: file});
      const pb = await page.evaluate(() => {
        const p = Reveal.getCurrentSlide().querySelector('canvas-commons-player')?.player?.playback;
        return p ? {frame: p.frame, fps: p.fps} : null;
      });
      written.push(file);
      // The frame is the ground truth: the player loops, and t0 lags the real start slightly.
      console.log(pb ? `${file}  (frame ${pb.frame}, ${(pb.frame / pb.fps).toFixed(2)}s into the scene)` : file);
    }
  } catch (e) {
    console.error(`screenshot-slide: ${e.message}`);
    return 4;
  } finally {
    await browser.close();
    server.close();
  }
  return written.length ? 0 : 4;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
