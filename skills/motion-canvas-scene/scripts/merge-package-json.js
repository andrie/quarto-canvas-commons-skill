#!/usr/bin/env node
// Merge the template's root package.json into an existing one, for adding
// Canvas Commons to an existing project. Adds missing dependencies and the
// build:player script; never changes a value that is already there.
//
// usage: merge-package-json.js <template package.json> <target package.json> [--dry-run]
import fs from 'node:fs';

export function mergePackageJson(template, target) {
  const out = structuredClone(target);
  const report = {added: [], kept: [], conflicts: []};
  const has = (name) => out.dependencies?.[name] ?? out.devDependencies?.[name];

  for (const section of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(template[section] ?? {})) {
      const existing = has(name);
      if (existing === undefined) {
        out[section] = {...(out[section] ?? {}), [name]: version};
        report.added.push(`${section}.${name} ${version}`);
      } else if (existing === version) {
        report.kept.push(`${name} ${existing}`);
      } else {
        report.conflicts.push(`${name}: kept ${existing}, template wants ${version}`);
      }
    }
  }

  for (const [name, command] of Object.entries(template.scripts ?? {})) {
    const existing = out.scripts?.[name];
    if (existing === undefined) {
      out.scripts = {...(out.scripts ?? {}), [name]: command};
      report.added.push(`scripts.${name}`);
    } else if (existing === command) {
      report.kept.push(`scripts.${name}`);
    } else {
      report.conflicts.push(`scripts.${name}: kept "${existing}", template wants "${command}"`);
    }
  }
  return {merged: out, report};
}

function main(argv) {
  const dryRun = argv.includes('--dry-run');
  const [templatePath, targetPath] = argv.filter((a) => a !== '--dry-run');
  if (!templatePath || !targetPath) {
    console.error('usage: merge-package-json.js <template package.json> <target package.json> [--dry-run]');
    process.exit(1);
  }
  const text = fs.readFileSync(targetPath, 'utf8');
  const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '  ';
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const {merged, report} = mergePackageJson(JSON.parse(fs.readFileSync(templatePath, 'utf8')), JSON.parse(text));
  for (const line of report.added) console.log(`added: ${line}`);
  for (const line of report.kept) console.log(`already present: ${line}`);
  for (const line of report.conflicts) console.log(`conflict: ${line}`);
  if (report.added.length === 0) console.log('nothing to add');
  else if (dryRun) console.log('dry run: package.json not written');
  else fs.writeFileSync(targetPath, JSON.stringify(merged, null, indent).replace(/\n/g, eol) + eol);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname)) {
  main(process.argv.slice(2));
}
