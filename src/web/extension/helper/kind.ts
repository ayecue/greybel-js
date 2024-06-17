import { CompletionItemKind as EntityCompletionItemKind } from 'miniscript-type-analyzer';
import type { languages } from 'monaco-editor/esm/vs/editor/editor.api.js';

export const getCompletionItemKind = (
  kind: EntityCompletionItemKind
): languages.CompletionItemKind => {
  switch (kind) {
    case EntityCompletionItemKind.Constant:
      return 14;
    case EntityCompletionItemKind.Variable:
      return 4;
    case EntityCompletionItemKind.Expression:
      return 4;
    case EntityCompletionItemKind.Function:
      return 1;
    case EntityCompletionItemKind.ListConstructor:
    case EntityCompletionItemKind.MapConstructor:
    case EntityCompletionItemKind.Literal:
    case EntityCompletionItemKind.Unknown:
      return 13;
  }
};

export const getSymbolItemKind = (
  kind: EntityCompletionItemKind
): languages.SymbolKind => {
  switch (kind) {
    case EntityCompletionItemKind.Constant:
      return 13;
    case EntityCompletionItemKind.Variable:
      return 12;
    case EntityCompletionItemKind.Expression:
      return 12;
    case EntityCompletionItemKind.Function:
      return 11;
    case EntityCompletionItemKind.ListConstructor:
      return 17;
    case EntityCompletionItemKind.MapConstructor:
      return 18;
    case EntityCompletionItemKind.Literal:
    case EntityCompletionItemKind.Unknown:
      return 12;
  }
};
