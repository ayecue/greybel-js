import { GreybelKeyword } from 'greybel-core';
import { Keyword as CoreKeyword } from 'greyscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { PseudoCompletionItem } from '../helper/vs.js';

export const AVAILABLE_KEYWORDS = [
  CoreKeyword.If,
  CoreKeyword.In,
  CoreKeyword.Or,
  CoreKeyword.And,
  CoreKeyword.Isa,
  CoreKeyword.For,
  CoreKeyword.New,
  CoreKeyword.Not,
  CoreKeyword.End,
  CoreKeyword.Then,
  CoreKeyword.Else,
  CoreKeyword.Break,
  CoreKeyword.While,
  CoreKeyword.Return,
  CoreKeyword.Function,
  CoreKeyword.Continue,
  CoreKeyword.ImportCode,
  GreybelKeyword.Envar,
  GreybelKeyword.Import,
  GreybelKeyword.Include,
  GreybelKeyword.Debugger,
  GreybelKeyword.From
] as const;

export const getAvailableKeywords = (
  range: Monaco.Range
): PseudoCompletionItem[] => {
  return AVAILABLE_KEYWORDS.map((label: string) => {
    return new PseudoCompletionItem({
      label,
      kind: Monaco.languages.CompletionItemKind.Keyword,
      insertText: label,
      range
    });
  });
};
