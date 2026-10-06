// Shared helpers for the offline Canvas Commons API generators.
//
// Dependencies: Node 18+ and the `typescript` package (compiler API, parse only, no type-checking).
// Nothing else. Resolve typescript from --ts <path-to-node_modules/typescript> or from require.resolve.
// To get it: `npm install --no-save typescript` in a temp directory, or point --ts at an existing
// node_modules/typescript (any Canvas Commons project has one).
//
// Ported from mcp-node-motion-canvas (ContentCollector, DocsProcessor, search-utils,
// component-hierarchy). The MCP tool registration, zod schemas and result formatting are dropped.

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);

export function parseArgs(argv, defaults = {}) {
  const opts = {...defaults};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const [k, inline] = a.slice(2).split('=');
    opts[k] = inline !== undefined ? inline : argv[++i];
  }
  return opts;
}

export function loadTypescript(tsPath) {
  try {
    return tsPath ? require(path.resolve(tsPath)) : require('typescript');
  } catch (e) {
    console.error(
      'Cannot load the `typescript` package (' + e.message.split('\n')[0] + ').\n' +
        'Pass --ts <path/to/node_modules/typescript>, or run `npm install --no-save typescript` in a temp directory and point --ts at it.',
    );
    process.exit(2);
  }
}

export function repoInfo(repo) {
  const pkgFile = path.join(repo, 'packages/core/package.json');
  if (!fs.existsSync(pkgFile)) {
    console.error(`Not a Canvas Commons clone: ${pkgFile} is missing (use --repo <path>).`);
    process.exit(2);
  }
  const version = JSON.parse(fs.readFileSync(pkgFile, 'utf8')).version;
  const git = (...args) => {
    const r = spawnSync('git', ['-C', repo, ...args], {encoding: 'utf8'});
    return r.status === 0 ? r.stdout.trim() : '';
  };
  const commit = git('rev-parse', '--short', 'HEAD') || 'unknown';
  return {version, commit};
}

const SKIP_DIR = new Set(['node_modules', '__tests__', '__logs__', '__snapshots__', 'dist', 'lib-types']);

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) walk(p, exts, out);
    } else if (exts.some((x) => e.name.endsWith(x)) && !/\.(test|spec)\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

export const PACKAGES = ['core', '2d'];

/** TypeScript sources of the packages that make up the animation-author API. */
export function collectSources(repo, pkg) {
  return walk(path.join(repo, 'packages', pkg, 'src'), ['.ts', '.tsx']);
}

export function readDocsMdx(repo) {
  return walk(path.join(repo, 'packages/docs/docs'), ['.mdx', '.md']);
}

export function exampleScenes(repo) {
  return walk(path.join(repo, 'packages/examples/src/scenes'), ['.tsx']);
}

// ---------------------------------------------------------------------------------------------
// Declaration extraction (TypeScript compiler API)

function hasMod(ts, node, kind) {
  return !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind[kind]);
}

/** Turn `{@link Foo.bar | label}` into plain text. */
function unlink(text) {
  return text.replace(/\{@(?:link|linkcode|linkplain)\s+([^}|\s]+)(?:[|\s]+([^}]*))?\}/g, (_, target, label) => (label || target).trim());
}

function jsdocOf(ts, node) {
  const docs = node.jsDoc;
  if (!docs || !docs.length) return {description: '', tags: []};
  const d = docs[docs.length - 1];
  const text = (c) => unlink((ts.getTextOfJSDocComment(c) || '').trim());
  const description = text(d.comment);
  const tags = (d.tags || []).map((t) => ({name: t.tagName.text, text: text(t.comment)}));
  return {description, tags};
}

function firstParagraph(text, max = 400) {
  const p = text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  return p.length > max ? p.slice(0, max - 1).trimEnd() + '…' : p;
}

function squash(text, max = 240) {
  const s = text.replace(/\s+/g, ' ').replace(/\s*[{;]\s*$/, '').trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

function startAfterDecorators(ts, node, sf) {
  const mod = node.modifiers?.find((m) => m.kind !== ts.SyntaxKind.Decorator);
  return mod ? mod.getStart(sf) : node.name ? node.name.getStart(sf) : node.getStart(sf);
}

/** Strip a fenced code block (```tsx ... ```) from an @example body, keep the code. */
export function stripFence(text) {
  const m = text.match(/```[a-z]*\n?([\s\S]*?)```/);
  return (m ? m[1] : text).trim();
}

function exampleTags(tags) {
  return tags.filter((t) => t.name === 'example' && t.text).map((t) => stripFence(t.text));
}

function memberInfo(ts, m, sf) {
  if (!m.name || ts.isConstructorDeclaration(m)) return null;
  if (hasMod(ts, m, 'PrivateKeyword') || hasMod(ts, m, 'ProtectedKeyword')) return null;
  if (ts.isPrivateIdentifier(m.name)) return null;
  const name = m.name.getText(sf);
  if (name.startsWith('_') || name.startsWith('[')) return null;
  const doc = jsdocOf(ts, m);
  if (doc.tags.some((t) => t.name === 'internal')) return null;
  let kind;
  let end;
  if (ts.isPropertyDeclaration(m) || ts.isPropertySignature(m)) {
    kind = 'property';
    end = m.type ? m.type.end : m.name.end;
  } else if (ts.isMethodDeclaration(m) || ts.isMethodSignature(m)) {
    kind = 'method';
    end = m.body ? m.body.getStart(sf) : m.end;
  } else if (ts.isGetAccessor(m) || ts.isSetAccessor(m)) {
    kind = 'accessor';
    end = m.body ? m.body.getStart(sf) : m.end;
  } else return null;
  return {
    name,
    kind,
    signature: squash(sf.text.slice(startAfterDecorators(ts, m, sf), end), 200),
    description: firstParagraph(doc.description, 240),
  };
}

function heritage(ts, node, sf, unalias = (n) => n) {
  let ext = null;
  const impl = [];
  for (const h of node.heritageClauses || []) {
    for (const t of h.types) {
      const name = unalias(t.expression.getText(sf));
      if (h.token === ts.SyntaxKind.ExtendsKeyword && !ext) ext = name;
      else impl.push(name);
    }
  }
  return {extends: ext, implements: impl};
}

/**
 * Exported declarations of one source file.
 * Returns objects: {name, kind, package, file, signature, description, extends?, members?, examples}
 */
export function extractDeclarations(ts, sf, pkg, file) {
  const out = [];
  // `import {SVG as SVGNode}` means `extends SVGNode` really extends SVG.
  const aliases = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue;
    const named = st.importClause?.namedBindings;
    if (named && ts.isNamedImports(named)) {
      for (const el of named.elements) if (el.propertyName) aliases.set(el.name.text, el.propertyName.text);
    }
  }
  const unalias = (n) => (n && aliases.get(n)) || n;
  const add = (node, name, kind, signature, extra = {}) => {
    const doc = jsdocOf(ts, node);
    if (doc.tags.some((t) => t.name === 'internal')) return;
    out.push({
      name,
      kind,
      package: pkg,
      file,
      signature: squash(signature),
      description: firstParagraph(doc.description),
      examples: exampleTags(doc.tags),
      ...extra,
    });
  };
  for (const st of sf.statements) {
    if (!hasMod(ts, st, 'ExportKeyword')) continue;
    if (ts.isClassDeclaration(st) && st.name) {
      const h = heritage(ts, st, sf, unalias);
      const tp = st.typeParameters ? `<${st.typeParameters.map((p) => p.getText(sf)).join(', ')}>` : '';
      const sig = `${hasMod(ts, st, 'AbstractKeyword') ? 'abstract ' : ''}class ${st.name.text}${tp}` +
        (h.extends ? ` extends ${h.extends}` : '') + (h.implements.length ? ` implements ${h.implements.join(', ')}` : '');
      const members = st.members.map((m) => memberInfo(ts, m, sf)).filter(Boolean);
      add(st, st.name.text, 'class', sig, {
        abstract: hasMod(ts, st, 'AbstractKeyword'),
        extends: h.extends ? h.extends.replace(/<.*$/, '') : null,
        members,
      });
    } else if (ts.isInterfaceDeclaration(st)) {
      const h = heritage(ts, st, sf, unalias);
      const tp = st.typeParameters ? `<${st.typeParameters.map((p) => p.getText(sf)).join(', ')}>` : '';
      const ext = st.heritageClauses?.map((c) => c.types.map((t) => t.getText(sf)).join(', ')).join(', ');
      add(st, st.name.text, 'interface', `interface ${st.name.text}${tp}${ext ? ' extends ' + ext : ''}`, {
        extends: h.extends ? h.extends.replace(/<.*$/, '') : null,
        members: st.members.map((m) => memberInfo(ts, m, sf)).filter(Boolean),
      });
    } else if (ts.isFunctionDeclaration(st) && st.name) {
      add(st, st.name.text, 'function', sf.text.slice(startAfterDecorators(ts, st, sf) - 0, st.body ? st.body.getStart(sf) : st.end).replace(/^export\s+(default\s+)?/, ''));
    } else if (ts.isTypeAliasDeclaration(st)) {
      add(st, st.name.text, 'type', st.getText(sf).replace(/^export\s+/, ''));
    } else if (ts.isEnumDeclaration(st)) {
      add(st, st.name.text, 'enum', `enum ${st.name.text} { ${st.members.map((m) => m.name.getText(sf)).join(', ')} }`);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        const kw = st.declarationList.flags & ts.NodeFlags.Const ? 'const' : 'let';
        add(st, d.name.text, 'variable', `${kw} ${d.name.text}` + (d.type ? ': ' + d.type.getText(sf) : ''));
      }
    }
  }
  return out;
}

export function parseSource(ts, file) {
  const text = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

export function relativeToRepo(repo, file) {
  return path.relative(repo, file).split(path.sep).join('/');
}

export function writeOut(out, text) {
  fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
  fs.writeFileSync(out, text);
}
