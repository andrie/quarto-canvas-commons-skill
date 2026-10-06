#!/usr/bin/env node
// Query references/api-search-index.json offline.
//
//   node search-api.js <query> [--limit 8] [--index <file.json>]
//
// No dependencies and no TypeScript: it reads the committed index. Multi-word queries are split into content
// words (stop-words dropped) and each entry is scored by how many words match, so partial matches rank.
// Intent phrases ("fade in", "stagger", "move along path", QUERY_INTENTS) lead to the real APIs. Supported: exact name, alias (TERM_TO_COMPONENT: "rectangle" finds Rect),
// prefix, substring, synonym and purpose expansion (API_SYNONYMS, PURPOSE_TO_API), member names,
// descriptions, and a typo fallback: when fewer than 3 results match, the query is corrected to the
// nearest known name, synonym or alias by bounded Levenshtein distance (at most length/3 edits).
// Not supported: true fuzzysort-style subsequence matching (a short query such as "rct" only works when it is within one edit of a name), and the MCP
// project's hierarchy-validated term scoring. Both were dropped in the port.

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TERM_TO_COMPONENT, QUERY_INTENTS, STOP_WORDS} from './search-data.js';

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

const INTENT_BASE = 110;

/** Content words of a query: split on whitespace and commas, lower-cased, stop-words dropped. */
export function contentWords(query) {
  const all = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const kept = all.filter((w) => !STOP_WORDS.has(w));
  return kept.length ? kept : all;
}

// Find the key's whole words as a contiguous run of still-unused query tokens; returns the start or -1.
function findRun(tokens, used, key) {
  const k = key.toLowerCase().split(/\s+/);
  for (let i = 0; i + k.length <= tokens.length; i++) {
    if (k.every((w, j) => tokens[i + j] === w && !used[i + j])) return i;
  }
  return -1;
}

/**
 * Resolve intent phrases in the query. Returns {targets: Map(lowercased target -> score), rest: remaining words}.
 * QUERY_INTENTS phrases are tried first, longest first, and consume their words; the index's older
 * purposeToApi phrases then apply to the words left over, with a flat score.
 */
function resolveIntents(index, query) {
  const tokens = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const used = tokens.map(() => false);
  const targets = new Map();
  const apply = (table, scoreOf, consume) => {
    const keys = Object.keys(table).sort((x, y) => y.split(' ').length - x.split(' ').length);
    for (const key of keys) {
      const at = findRun(tokens, used, key);
      if (at < 0) continue;
      table[key].forEach((t, i) => {
        const tl = t.toLowerCase();
        targets.set(tl, Math.max(targets.get(tl) || 0, scoreOf(i)));
      });
      if (consume) key.split(/\s+/).forEach((_, j) => { used[at + j] = true; });
    }
  };
  apply(QUERY_INTENTS, (i) => INTENT_BASE - 2 * i, true);
  const stopOnly = tokens.every((t, i) => used[i] || STOP_WORDS.has(t));
  if (!stopOnly) apply(index.purposeToApi || {}, () => 30, false);
  const rest = tokens.filter((t, i) => !used[i] && !STOP_WORDS.has(t));
  return {targets, rest: rest.length || targets.size ? rest : contentWords(query)};
}

// Score one entry for one word: exact name, alias, prefix, substring, synonym, member name, description.
function scoreWord(e, w, alias, extra) {
  const n = e.name.toLowerCase();
  let score = 0;
  if (n === w) score = 100;
  else if (alias && n === alias) score = 90;
  else if (n.startsWith(w)) score = 60;
  else if (n.includes(w)) score = 40;
  else if (extra.includes(n)) score = 30;
  else if ((e.members || []).some((m) => m.name.toLowerCase() === w)) score = 20;
  else if ((e.description || '').toLowerCase().includes(w)) score = 10;
  return score;
}

const MULTI_WORD_BONUS = 15;

// Intents, then per-word scoring summed across the words, so partial matches rank rather than vanish.
function scoreAll(index, query) {
  const {targets, rest} = resolveIntents(index, query);
  const words = [...new Set(rest)];
  const perWord = words.map((w) => ({w, alias: (TERM_TO_COMPONENT[w] || '').toLowerCase(), extra: expand(w, index)}));
  const nodeLike = perWord.some((p) => p.alias);
  const names = new Set(index.entries.map((e) => e.name.toLowerCase()));
  const scores = new Map();
  for (const e of index.entries) {
    const n = e.name.toLowerCase();
    let total = 0;
    let matched = 0;
    for (const p of perWord) {
      const sc = scoreWord(e, p.w, p.alias, p.extra);
      if (sc) { total += sc; matched++; }
    }
    if (matched > 1) total += MULTI_WORD_BONUS * (matched - 1);
    let intent = targets.get(n) || 0;
    // A target also matches a class member, but only when no entry of that name exists (Curve.getPointAtPercentage).
    for (const m of e.members || []) if (!names.has(m.name.toLowerCase())) intent = Math.max(intent, (targets.get(m.name.toLowerCase()) || 0) - 2);
    total += intent;
    if (total && e.kind === 'class') total += nodeLike ? 15 : 5;
    if (total) scores.set(e, total);
  }
  return scores;
}

const FUZZY_BELOW = 3;

export function search(index, query, limit = 8) {
  const scores = scoreAll(index, query);
  if (scores.size < FUZZY_BELOW) {
    // Typo fallback: correct each content word to the nearest known name, synonym key or alias, then score that.
    const vocab = new Set([
      ...index.entries.map((e) => e.name.toLowerCase()),
      ...Object.keys(index.synonyms || {}).map((k) => k.toLowerCase()),
      ...Object.keys(TERM_TO_COMPONENT),
    ]);
    for (const q of contentWords(query)) {
      const max = Math.max(1, Math.floor(q.length / 3));
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
  }
  return [...scores]
    .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name))
    .slice(0, limit)
    .map(([e]) => e);
}

/** Lower-cased words and intent targets a query resolves to, used to pick which members to print in full. */
export function queryTerms(index, query) {
  const {targets, rest} = resolveIntents(index, query);
  return new Set([...targets.keys(), ...rest]);
}

function show(e, terms = new Set()) {
  const lines = [`${e.name} (${e.kind}, ${e.package})  ${e.file}`, `  ${e.signature}`];
  if (e.description) lines.push(`  ${e.description}`);
  if (e.members?.length) lines.push(`  members: ${e.members.map((m) => m.name).join(', ')}`);
  for (const m of e.members || []) if (terms.has(m.name.toLowerCase())) lines.push(`  ${m.kind} ${m.name}: ${m.signature}${m.description ? `  (${m.description})` : ''}`);
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
  const query = words.join(' ');
  const hits = search(index, query, limit);
  const terms = queryTerms(index, query);
  console.log(hits.length ? hits.map((e) => show(e, terms)).join('\n\n') : 'No matches.');
}
