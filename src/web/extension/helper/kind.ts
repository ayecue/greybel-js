import { CompletionItemKind as EntityCompletionItemKind } from 'greybel-type-analyzer';
import type { languages } from 'monaco-editor/esm/vs/editor/editor.api.js';

const CompletionItemKindMapping: Record<
  EntityCompletionItemKind,
  languages.CompletionItemKind
> = {
  [EntityCompletionItemKind.Constant]: 14,
  [EntityCompletionItemKind.Internal]: 14,
  [EntityCompletionItemKind.InternalFunction]: 14,
  [EntityCompletionItemKind.InternalProperty]: 14,
  [EntityCompletionItemKind.Property]: 4,
  [EntityCompletionItemKind.Variable]: 4,
  [EntityCompletionItemKind.Expression]: 4,
  [EntityCompletionItemKind.Function]: 1,
  [EntityCompletionItemKind.ListConstructor]: 17,
  [EntityCompletionItemKind.MapConstructor]: 18,
  [EntityCompletionItemKind.Literal]: 13,
  [EntityCompletionItemKind.Unknown]: 13
};

export const getCompletionItemKind = (
  kind: EntityCompletionItemKind
): languages.CompletionItemKind => {
  return CompletionItemKindMapping[kind] || 4;
};

const SymbolKindMapping: Record<
  EntityCompletionItemKind,
  languages.SymbolKind
> = {
  [EntityCompletionItemKind.Constant]: 13,
  [EntityCompletionItemKind.Internal]: 13,
  [EntityCompletionItemKind.InternalFunction]: 13,
  [EntityCompletionItemKind.InternalProperty]: 13,
  [EntityCompletionItemKind.Property]: 12,
  [EntityCompletionItemKind.Variable]: 12,
  [EntityCompletionItemKind.Expression]: 12,
  [EntityCompletionItemKind.Function]: 11,
  [EntityCompletionItemKind.ListConstructor]: 17,
  [EntityCompletionItemKind.MapConstructor]: 18,
  [EntityCompletionItemKind.Literal]: 12,
  [EntityCompletionItemKind.Unknown]: 12
};

export const getSymbolItemKind = (
  kind: EntityCompletionItemKind
): languages.SymbolKind => {
  return SymbolKindMapping[kind] || 12;
};
