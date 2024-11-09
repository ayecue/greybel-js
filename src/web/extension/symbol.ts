import { ASTAssignmentStatement } from 'miniscript-core';
import { createExpressionId } from 'miniscript-type-analyzer';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { getSymbolItemKind } from './helper/kind.js';
import documentParseQueue from './helper/model-manager.js';
import typeManager from './helper/type-manager.js';

const findAllAssignments = (
  monaco: typeof Monaco,
  document: Monaco.editor.ITextModel,
  query: string
): Monaco.languages.DocumentSymbol[] => {
  const typeDoc = typeManager.get(document.uri.fsPath);
  const assignments = typeDoc.resolveAllAssignmentsWithQuery(query);
  const result: Monaco.languages.DocumentSymbol[] = [];

  for (const assignmentItem of assignments) {
    const assignment = assignmentItem.node as ASTAssignmentStatement;
    const entity = typeDoc.resolveNamespace(assignment.variable, true);
    const label = entity?.label ?? createExpressionId(assignment.variable);
    const kind = entity?.kind
      ? getSymbolItemKind(entity.kind)
      : monaco.languages.SymbolKind.Variable;

    const range = new monaco.Range(
      assignment.variable.start.line,
      assignment.variable.start.character,
      assignment.variable.end.line,
      assignment.variable.end.character
    );

    result.push({
      name: label,
      detail: label,
      kind,
      range,
      tags: [],
      selectionRange: range
    });
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
