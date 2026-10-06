// Text-level edits of the `project: [...]` array in a Vite config.
// Deliberately not an AST edit: the array is the only thing we touch, and
// comments inside it (e.g. a commented-out entry) must survive.
const OPEN = /project:\s*\[/;

function arrayBounds(source) {
  const open = OPEN.exec(source);
  if (!open) throw new Error('project array not found');
  const start = open.index + open[0].length;
  const end = source.indexOf(']', start);
  if (end === -1) throw new Error('project array not found');
  return {start, end};
}

const quoted = (entry) => new RegExp(`^[ \\t]*["']${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'],?[ \\t]*\\r?\\n?`, 'm');

export function addEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  if (quoted(entry).test(source.slice(start, end))) return source;
  return `${source.slice(0, start)}\n        "${entry}",${source.slice(start)}`;
}

export function removeEntry(source, entry) {
  const {start, end} = arrayBounds(source);
  const body = source.slice(start, end);
  return source.slice(0, start) + body.replace(quoted(entry), '') + source.slice(end);
}
