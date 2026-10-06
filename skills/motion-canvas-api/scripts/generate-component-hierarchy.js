#!/usr/bin/env node
// Generate references/component-hierarchy.md (an ASCII class tree) from a Canvas Commons clone.
//
//   node generate-component-hierarchy.js --repo <clone> --out <file.md> [--ts <node_modules/typescript>]
//
// Dependencies: `typescript` only (see shared.js). Reads TypeScript sources in packages/2d/src/**/components.
// Ported from mcp-node-motion-canvas src/tools/component-hierarchy.ts (same tree layout and
// External Dependencies handling). Descriptions come from each class's own JSDoc instead of the
// MCP project's hard-coded table, so they cannot drift from the source.

import path from 'node:path';
import {
  parseArgs, loadTypescript, repoInfo, collectSources, parseSource, extractDeclarations,
  relativeToRepo, writeOut,
} from './shared.js';

const opts = parseArgs(process.argv.slice(2));
if (!opts.repo || !opts.out || opts.help) {
  console.error('Usage: node generate-component-hierarchy.js --repo <canvas-commons clone> --out <file.md> [--ts <path to typescript>]');
  process.exit(opts.help ? 0 : 1);
}
const repo = path.resolve(opts.repo);
const ts = loadTypescript(opts.ts);
const {version, commit} = repoInfo(repo);

const classes = [];
const propsDocs = new Map();
for (const f of collectSources(repo, '2d')) {
  const rel = relativeToRepo(repo, f);
  if (!/\/components\//.test(rel)) continue;
  const sf = parseSource(ts, f);
  for (const d of extractDeclarations(ts, sf, '2d', rel)) {
    if (d.kind === 'class') classes.push(d);
    else if (d.kind === 'interface' && d.description) propsDocs.set(d.name, d.description);
  }
}
// Several 0.4.0 classes carry their JSDoc on the matching `<Name>Props` interface instead.
for (const c of classes) if (!c.description) c.description = propsDocs.get(`${c.name}Props`) || '';

// Unique display names: a second class with the same name becomes "Name (file)".
const seen = new Map();
for (const c of classes) {
  const n = seen.get(c.name) || 0;
  seen.set(c.name, n + 1);
  c.label = n === 0 ? c.name : `${c.name} (${path.basename(c.file, path.extname(c.file))})`;
}
const byName = new Map();
for (const c of classes) if (!byName.has(c.name)) byName.set(c.name, c);

const node = (label, description) => ({label, description, children: []});
const nodes = new Map(classes.map((c) => [c, node(c.label, firstSentence(c.description))]));
const root = node('Node', firstSentence(byName.get('Node')?.description || ''));
const external = node('External Dependencies', 'Classes that extend something outside packages/2d components');
nodes.set(byName.get('Node'), root);

for (const c of classes) {
  if (c.name === 'Node') continue;
  const parent = c.extends && byName.get(c.extends);
  if (parent) nodes.get(parent).children.push(nodes.get(c));
  else if (!c.extends || c.extends === 'Node') root.children.push(nodes.get(c));
  else {
    let p = external.children.find((x) => x.label === c.extends);
    if (!p) external.children.push((p = node(c.extends, `External class extended by ${c.name}`)));
    p.children.push(nodes.get(c));
  }
}
if (external.children.length) root.children.push(external);

function firstSentence(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : t;
}
function sortTree(n) {
  n.children.sort((a, b) => a.label.localeCompare(b.label));
  n.children.forEach(sortTree);
}
function render(n, prefix = '', last = true) {
  let s = `${prefix}${last ? '└── ' : '├── '}${n.label}${n.description ? ': ' + n.description : ''}\n`;
  const next = prefix + (last ? '    ' : '│   ');
  n.children.forEach((c, i) => (s += render(c, next, i === n.children.length - 1)));
  return s;
}
sortTree(root);

const text = [
  '# Canvas Commons component hierarchy',
  '',
  `Generated from canvas-commons/canvas-commons, version ${version}, commit ${commit}, by \`skills/motion-canvas-api/scripts/generate-component-hierarchy.js\`. Do not edit by hand.`,
  '',
  'Each line is a class from `packages/2d/src/**/components`, with the first sentence of its JSDoc. Children extend their parent. A class with no description has no JSDoc in the 0.4.0 source.',
  '',
  '```',
  root.label + (root.description ? ': ' + root.description : ''),
  root.children.map((c, i) => render(c, '', i === root.children.length - 1)).join('').trimEnd(),
  '```',
  '',
].join('\n');
writeOut(opts.out, text);
console.log(`Wrote ${classes.length} classes (version ${version}, commit ${commit}) to ${opts.out}`);
