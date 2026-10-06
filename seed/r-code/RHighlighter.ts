import { Parser, Tree } from '@lezer/common';
import { CodeHighlighter, HighlightResult } from '@motion-canvas/2d/lib/code/CodeHighlighter';

interface RCache {
  tree: Tree;
  code: string;
  colorLookup: Map<string, string>;
}

export class RHighlighter implements CodeHighlighter<RCache | null> {
  private readonly parser: Parser;
  private readonly colors: Record<string, string>;

  constructor(parser: Parser, colors: Record<string, string>) {
    this.parser = parser;
    this.colors = colors;
  }

  initialize(): boolean {
    return true;
  }

  prepare(code: string): RCache | null {
    const tree = this.parser.parse(code);
    const colorLookup = new Map<string, string>();

    // Walk the tree and assign colors based on node types
    this.walkTree(tree.topNode, code, colorLookup);

    return { tree, code, colorLookup };
  }

  private walkTree(node: any, code: string, colorLookup: Map<string, string>) {
    // Map node types to colors - be more specific about what gets colored
    let color: string | null = null;

    switch (node.name) {
      case 'Identifier':
        // Check if it's a function call
        if (node.parent && node.parent.name === 'FunctionCall') {
          color = this.colors.function;
        } else {
          color = this.colors.identifier;
        }
        break;
      case 'function':
        color = this.colors.keyword;
        break;
      case 'String':
        color = this.colors.string;
        break;
      case 'Comment':
        color = this.colors.comment;
        break;
      case 'AssignmentOperator':
        color = this.colors.operator;
        break;
      case 'ExtractionOp':
        color = this.colors.operator;
        break;
      case 'ArithOp':
      case 'CompareOp':
        color = this.colors.operator;
        break;
      case 'Numeric':
      case 'Integer':
        color = this.colors.number;
        break;
    }

    // Only set color for terminal nodes (nodes with actual text content)
    if (color && !node.firstChild) {
      colorLookup.set(`${node.from}-${node.to}`, color);
    }

    // Recurse to children
    let child = node.firstChild;
    while (child) {
      this.walkTree(child, code, colorLookup);
      child = child.nextSibling;
    }
  }

  highlight(index: number, cache: RCache | null): HighlightResult {
    if (!cache) {
      return { color: this.colors.default, skipAhead: 0 };
    }

    // Find the color for this character position
    for (const [range, color] of cache.colorLookup.entries()) {
      const [start, end] = range.split('-').map(Number);
      if (index >= start && index < end) {
        return { color, skipAhead: end - index - 1 };
      }
    }

    return { color: this.colors.default, skipAhead: 0 };
  }

  tokenize(code: string): string[] {
    return code.split(/(\s+)/);
  }
}