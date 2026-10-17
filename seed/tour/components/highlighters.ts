import {LezerHighlighter} from '@canvas-commons/2d';
import {HighlightStyle} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {parser as pythonParser} from '@lezer/python';
import {parser as rParser} from 'lezer-r';
import {Colors, Posit} from '../styles';
import {RHighlighter} from './RHighlighter';

// Syntax colours for R and Python code in the guide scenes, from the Posit palette
export const rHighlighter = new RHighlighter(rParser, {
  default: Colors.TEXT,
  identifier: Posit.orange,
  function: Colors.FUNCTION,
  keyword: Colors.KEYWORD,
  string: Colors.STRING,
  comment: Colors.COMMENT,
  operator: Posit.teal,
  number: Colors.NUMBER,
});

const pythonStyle = HighlightStyle.define([
  {tag: tags.keyword, color: Colors.KEYWORD},
  {tag: tags.string, color: Colors.STRING},
  {tag: tags.comment, color: Colors.COMMENT},
  {tag: [tags.number, tags.bool, tags.null], color: Colors.NUMBER},
  {tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: Colors.FUNCTION},
  {tag: tags.propertyName, color: Colors.PROPERTY},
  {tag: tags.variableName, color: Posit.orange},
  {tag: tags.operator, color: Posit.teal},
  {tag: tags.punctuation, color: Colors.TEXT},
]);

export const pythonHighlighter = new LezerHighlighter(pythonParser, pythonStyle);
