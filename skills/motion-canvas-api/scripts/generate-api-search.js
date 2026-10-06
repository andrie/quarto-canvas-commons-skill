#!/usr/bin/env node
// Generate references/api-search-index.json from a Canvas Commons clone.
//
//   node generate-api-search.js --repo <clone> --out <file.json> [--ts <node_modules/typescript>]
//
// Dependencies: `typescript` only (see shared.js). Reads TypeScript sources in packages/{core,2d}/src
// and the docs/examples in the clone. It does not build anything.
// Ported from mcp-node-motion-canvas: ContentCollector (docs and JSDoc examples), search-utils
// (class and JSDoc extraction), config (synonym and purpose data). MCP framing is dropped.

import fs from 'node:fs';
import path from 'node:path';
import {
  parseArgs, loadTypescript, repoInfo, collectSources, readDocsMdx, exampleScenes,
  parseSource, extractDeclarations, relativeToRepo, writeOut, PACKAGES,
} from './shared.js';
import {API_SYNONYMS, PURPOSE_TO_API} from './search-data.js';

const opts = parseArgs(process.argv.slice(2));
if (!opts.repo || !opts.out || opts.help) {
  console.error('Usage: node generate-api-search.js --repo <canvas-commons clone> --out <file.json> [--ts <path to typescript>]');
  process.exit(opts.help ? 0 : 1);
}
const repo = path.resolve(opts.repo);
const ts = loadTypescript(opts.ts);
const {version, commit} = repoInfo(repo);

const MAX_EXAMPLES = 3;
const MAX_EXAMPLE_CHARS = 1500;

// Code blocks from the docs, with the repo-relative file they came from.
const docBlocks = [];
for (const f of readDocsMdx(repo)) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/```(?:tsx|typescript|ts)[^\n]*\n([\s\S]*?)```/g)) {
    docBlocks.push({code: m[1].trim(), file: relativeToRepo(repo, f)});
  }
}
docBlocks.sort((a, b) => a.code.length - b.code.length); // prefer short, focused snippets
const scenes = exampleScenes(repo).map((f) => ({file: relativeToRepo(repo, f), text: fs.readFileSync(f, 'utf8')}));

const byKey = new Map();
for (const pkg of PACKAGES) {
  for (const f of collectSources(repo, pkg)) {
    const sf = parseSource(ts, f);
    for (const d of extractDeclarations(ts, sf, pkg, relativeToRepo(repo, f))) {
      const key = `${d.name}\0${d.kind}`;
      const prev = byKey.get(key);
      if (!prev) {
        d.signatures = [d.signature];
        byKey.set(key, d);
      } else {
        // Function overloads and merged declarations: keep every signature, first documented text wins.
        if (!prev.signatures.includes(d.signature)) prev.signatures.push(d.signature);
        if (!prev.description) prev.description = d.description;
        prev.examples.push(...d.examples);
      }
    }
  }
}

const entries = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
// Several 0.4.0 classes carry their JSDoc on the matching `<Name>Props` interface instead.
const interfaceDoc = new Map(entries.filter((e) => e.kind === 'interface' && e.description).map((e) => [e.name, e.description]));
for (const e of entries) {
  if (e.kind === 'class' && !e.description) e.description = interfaceDoc.get(`${e.name}Props`) || '';
}
for (const e of entries) {
  if (e.kind === 'class' || e.kind === 'function') {
    const pattern = new RegExp(e.kind === 'class' ? `<${e.name}[\\s/>]|\\b${e.name}\\(` : `\\b${e.name}\\(`);
    for (const b of docBlocks) {
      if (e.examples.length >= MAX_EXAMPLES) break;
      if (pattern.test(b.code) && !e.examples.includes(b.code)) e.examples.push(b.code.slice(0, MAX_EXAMPLE_CHARS));
    }
    const used = scenes.filter((s) => pattern.test(s.text)).map((s) => s.file);
    if (used.length) e.exampleScenes = used.slice(0, 5);
  }
  e.examples = [...new Set(e.examples)].slice(0, MAX_EXAMPLES).map((x) => x.slice(0, MAX_EXAMPLE_CHARS));
  if (e.signatures.length === 1) delete e.signatures;
  else e.signature = e.signatures[0];
  if (!e.examples.length) delete e.examples;
  if (!e.description) delete e.description;
  if (e.kind === 'class' && !e.extends) e.extends = null;
  if (e.members && !e.members.length) delete e.members;
  if (!e.abstract) delete e.abstract;
}

const index = {
  generator: 'skills/motion-canvas-api/scripts/generate-api-search.js',
  version,
  source: {repository: 'github.com/canvas-commons/canvas-commons', commit},
  entries,
  synonyms: API_SYNONYMS,
  purposeToApi: PURPOSE_TO_API,
};
writeOut(opts.out, JSON.stringify(index) + '\n');
console.log(`Wrote ${entries.length} entries (version ${version}, commit ${commit}) to ${opts.out}`);
