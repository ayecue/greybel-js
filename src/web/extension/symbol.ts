import { SymbolInfo } from 'greybel-type-analyzer';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { getSymbolItemKind } from './helper/kind.js';
import documentParseQueue from './helper/model-manager.js';
import typeManager from './helper/type-manager.js';

const handleItem = (
  monaco: typeof Monaco,
  item: SymbolInfo
): Monaco.languages.DocumentSymbol[] => {
  if (item.source == null) {
    return [];
  }

  const result: Monaco.languages.DocumentSymbol[] = [];

  const kind = item?.kind ? getSymbolItemKind(item.kind) : 13; // SymbolKind.Variable
  for (const source of item.source) {
    const range = new monaco.Range(
      source.start.line,
      source.start.character,
      source.end.line,
      source.end.character
    );

    result.push({
      name: item.name,
      detail: item.name,
      kind,
      range,
      tags: [],
      selectionRange: range
    });
  }

  return result;
};

const findAllAssignments = (
  monaco: typeof Monaco,
  document: Monaco.editor.ITextModel,
  query: string
): Monaco.languages.DocumentSymbol[] => {
  const typeDoc = typeManager.get(document.uri.fsPath);
  const defs = typeDoc.resolveAllAssignmentsWithQuery(query);
  const result: Monaco.languages.DocumentSymbol[] = [];

  for (const defItem of defs) {
    result.push(...handleItem(monaco, defItem));
  }

  return result;
};

export function activate(monaco: typeof Monaco) {
  monaco.languages.registerDocumentSymbolProvider('greyscript', {
    provideDocumentSymbols(
      document: Monaco.editor.ITextModel,
      _token: Monaco.CancellationToken
    ): Monaco.languages.ProviderResult<Monaco.languages.DocumentSymbol[]> {
      const parseResult = documentParseQueue.get(document);

      if (!parseResult.document) {
        return [];
      }

      return findAllAssignments(monaco, document, '');
    }
  });
}
