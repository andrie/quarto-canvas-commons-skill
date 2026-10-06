#!/usr/bin/env node
// Query references/api-search-index.json offline.
//
//   node search-api.js <query> [--limit 8] [--index <file.json>]
//
// No dependencies. Supported: exact name, alias (TERM_TO_COMPONENT: "rectangle" finds Rect),
// prefix, substring, synonym and purpose expansion (API_SYNONYMS, PURPOSE_TO_API), member names,
// descriptions, and a typo fallback: when fewer than 3 results match, the query is corrected to the
// nearest known name, synonym or alias by bounded Levenshtein distance (at most length/3 edits).
// Not supported: true fuzzysort-style subsequence matching (a short query such as "rct" only works when it is within one edit of a name), and the MCP
// project's hierarchy-validated term scoring. Both were dropped in the port.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TERM_TO_COMPONENT} from './search-data.js';

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

/** Levenshtein distance, giving up (returning max + 1) once it must exceed `max`. */
export function distance(a, b, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// Exact, alias, prefix, substring, synonym/purpose, member and description matching.
function scoreAll(index, query) {
  const q = query.toLowerCase().trim();
  const extra = expand(query, index);
  const alias = (TERM_TO_COMPONENT[q] || '').toLowerCase();
  const scores = new Map();
  for (const e of index.entries) {
    const n = e.name.toLowerCase();
    let score = 0;
    if (n === q) score = 100;
    else if (alias && n === alias) score = 90;
    else if (n.startsWith(q)) score = 60;
    else if (n.includes(q)) score = 40;
    else if (extra.includes(n)) score = 30;
    else if ((e.members || []).some((m) => m.name.toLowerCase() === q)) score = 20;
    else if ((e.description || '').toLowerCase().includes(q)) score = 10;
    if (score && e.kind === 'class') score += 5;
    if (score) scores.set(e, score);
  }
  return scores;
}

const FUZZY_BELOW = 3;

export function search(index, query, limit = 8) {
  const scores = scoreAll(index, query);
  if (scores.size < FUZZY_BELOW) {
    // Typo fallback: correct the query to the nearest known name, synonym key or alias, then score that.
    const q = query.toLowerCase().trim();
    const max = Math.max(1, Math.floor(q.length / 3));
    const vocab = new Set([
      ...index.entries.map((e) => e.name.toLowerCase()),
      ...Object.keys(index.synonyms || {}).map((k) => k.toLowerCase()),
      ...Object.keys(TERM_TO_COMPONENT),
    ]);
    const near = [...vocab]
      .map((t) => [t, distance(q, t, max)])
      .filter(([, d]) => d <= max && d > 0)
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .slice(0, 3);
    for (const [term, d] of near) {
      for (const [e, sc] of scoreAll(index, term)) {
        const fuzzy = Math.max(1, Math.floor(sc / 2) - d);
        if (!scores.has(e)) scores.set(e, fuzzy);
      }
    }
  }
  return [...scores]
    .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name))
    .slice(0, limit)
    .map(([e]) => e);
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
