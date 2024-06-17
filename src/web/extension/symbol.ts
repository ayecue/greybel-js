import { ASTAssignmentStatement } from 'miniscript-core';
import { createExpressionId } from 'miniscript-type-analyzer';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import documentParseQueue from './helper/model-manager.js';
import { TextDocument, getTextDocument } from './helper/vs.js';
import typeManager from './helper/type-manager.js';
import { getSymbolItemKind } from './helper/kind.js';

const findAllAssignments = (
  monaco: typeof Monaco,
  document: TextDocument,
  query: string
): Monaco.languages.DocumentSymbol[] => {
  const typeDoc = typeManager.get(document);
  const assignments = typeDoc.resolveAllAssignmentsWithQuery(query);
  const result: Monaco.languages.DocumentSymbol[] = [];

  for (const assignmentItem of assignments) {
    const assignment = assignmentItem as ASTAssignmentStatement;
    const entity = typeDoc.resolveNamespace(assignment.variable, true);
    const label = entity?.label ?? createExpressionId(assignmentItem.variable);
    const kind = entity?.kind ? getSymbolItemKind(entity.kind) : monaco.languages.SymbolKind.Variable;

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

      return findAllAssignments(
        monaco,
        getTextDocument(document),
        ''
      );
    }
  });
}
