import { ASTAssignmentStatement, ASTForGenericStatement, ASTType } from 'miniscript-core';
import { ASTDefinitionItem, createExpressionId, Document as MSDocument } from 'miniscript-type-analyzer';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { getSymbolItemKind } from './helper/kind.js';
import documentParseQueue from './helper/model-manager.js';
import typeManager from './helper/type-manager.js';

const handleItem = (
  monaco: typeof Monaco,
  typeDoc: MSDocument,
  item: ASTAssignmentStatement | ASTForGenericStatement
): Monaco.languages.DocumentSymbol | null => {
  const entity = typeDoc.resolveNamespace(item.variable, true);
  if (entity == null) {
    return null;
  }
  const label = createExpressionId(item.variable);
  const kind = entity?.kind ? getSymbolItemKind(entity.kind) : 13; // SymbolKind.Variable
  const range = new monaco.Range(
    item.variable.start.line,
    item.variable.start.character,
    item.variable.end.line,
    item.variable.end.character
  );
  return {
    name: label,
    detail: label,
    kind,
    range,
    tags: [],
    selectionRange: range
  };
};

const handleDefinitionItem = (
  monaco: typeof Monaco,
  typeDoc: MSDocument,
  item: ASTDefinitionItem
): Monaco.languages.DocumentSymbol | null => {
  switch (item.node.type) {
    case ASTType.AssignmentStatement:
      return handleItem(monaco, typeDoc, item.node as ASTAssignmentStatement);
    case ASTType.ForGenericStatement:
      return handleItem(monaco, typeDoc, item.node as ASTForGenericStatement);
    default:
      return null;
  }
};

const findAllAssignments = (
  monaco: typeof Monaco,
  document: Monaco.editor.ITextModel,
  query: string
): Monaco.languages.DocumentSymbol[] => {
  const typeDoc = typeManager.get(document.uri.fsPath);
  const assignments = typeDoc.resolveAllAssignmentsWithQuery(query);
  const result: Monaco.languages.DocumentSymbol[] = [];

  for (const assignmentItem of assignments) {
    const symbol = handleDefinitionItem(monaco, typeDoc, assignmentItem);

    if (symbol != null) {
      result.push(symbol);
    }
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
