#!/usr/bin/env node
// Query references/api-search-index.json offline.
//
//   node search-api.js <query> [--limit 8] [--index <file.json>]
//
// No dependencies. Ranking: exact name, then prefix, substring, synonym or purpose expansion
// (the ported PURPOSE_TO_API and API_SYNONYMS data), then member names and descriptions.
// Simplified from mcp-node-motion-canvas: the hierarchy-validated term scoring is dropped.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function expand(query, index) {
  const q = query.toLowerCase().trim();
  const terms = new Set();
  const syn = index.synonyms || {};
  const purpose = index.purposeToApi || {};
  for (const [k, v] of Object.entries(syn)) if (k.toLowerCase() === q) v.forEach((t) => terms.add(t));
  for (const [k, v] of Object.entries(purpose)) {
    if (k.toLowerCase() === q || (k.length > 3 && q.includes(k.toLowerCase()) && k.length >= q.length / 2)) v.forEach((t) => terms.add(t));
  }
  terms.delete(q);
  return [...terms].map((t) => t.toLowerCase());
}

export function search(index, query, limit = 8) {
  const q = query.toLowerCase().trim();
  const extra = expand(query, index);
  const scored = [];
  for (const e of index.entries) {
    const n = e.name.toLowerCase();
    let score = 0;
    if (n === q) score = 100;
    else if (n.startsWith(q)) score = 60;
    else if (n.includes(q)) score = 40;
    else if (extra.includes(n)) score = 30;
    else if ((e.members || []).some((m) => m.name.toLowerCase() === q)) score = 20;
    else if ((e.description || '').toLowerCase().includes(q)) score = 10;
    if (score && e.kind === 'class') score += 5;
    if (score) scored.push({score, e});
  }
  scored.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
  return scored.slice(0, limit).map((s) => s.e);
}

function show(e) {
  const lines = [`${e.name} (${e.kind}, ${e.package})  ${e.file}`, `  ${e.signature}`];
  if (e.description) lines.push(`  ${e.description}`);
  if (e.members?.length) lines.push(`  members: ${e.members.map((m) => m.name).join(', ')}`);
  if (e.examples?.length) lines.push(`  example:\n    ${e.examples[0].split('\n').join('\n    ')}`);
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let limit = 8;
  let indexFile = path.join(here, '../references/api-search-index.json');
  const words = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit') limit = Number(args[++i]);
    else if (args[i] === '--index') indexFile = args[++i];
    else words.push(args[i]);
  }
  if (!words.length) {
    console.error('Usage: node search-api.js <query> [--limit 8] [--index <file.json>]');
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  const hits = search(index, words.join(' '), limit);
  console.log(hits.length ? hits.map(show).join('\n\n') : 'No matches.');
}
