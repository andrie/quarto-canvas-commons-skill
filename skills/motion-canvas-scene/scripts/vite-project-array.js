// Text-level edits of the `project: [...]` array in a Vite config.
// Deliberately not an AST edit: the array is the only thing we touch, and
// comments inside it (e.g. a commented-out entry) must survive.
const OPEN = /^project\s*:\s*\[/;

// Walks the source skipping comments and string literals, finds the real
// `project: [` and returns the offsets just inside its brackets.
function arrayBounds(source) {
  let i = 0;
  let start = -1;
  let depth = 0;
  while (i < source.length) {
    const c = source[i];
    const two = source.slice(i, i + 2);
    if (two === '//') {
      const nl = source.indexOf('\n', i);
      i = nl === -1 ? source.length : nl + 1;
    } else if (two === '/*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? source.length : close + 2;
    } else if (c === '"' || c === "'" || c === '`') {
      i++;
      while (i < source.length && source[i] !== c) i += source[i] === '\\' ? 2 : 1;
      i++;
    } else if (start === -1) {
      const open = !/[\w$]/.test(source[i - 1] ?? '') && OPEN.exec(source.slice(i, i + 200));
      if (open) {
        i += open[0].length;
        start = i;
        depth = 1;
      } else {
        i++;
      }
    } else if (c === '[') {
      depth++;
      i++;
    } else if (c === ']') {
      if (--depth === 0) return {start, end: i};
      i++;
    } else {
      i++;
    }
  }
  throw new Error('project array not found');
}

const quoted = (entry) => new RegExp(`^[ \\t]*["']${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'],?[ \\t]*\\r?\\n?`, 'm');

export function addEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  if (quoted(entry).test(source.slice(start, end))) return source;
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return `${source.slice(0, start)}${eol}        "${entry}",${source.slice(start)}`;
}

export function removeEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  const body = source.slice(start, end);
  return source.slice(0, start) + body.replace(quoted(entry), '') + source.slice(end);
}
