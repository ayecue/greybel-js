import {
  ASTAssignmentStatement,
  ASTBaseBlockWithScope,
  ASTChunk
} from 'miniscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import transformASTToString from './helper/ast-stringify.js';
import documentParseQueue from './helper/model-manager.js';
import { removeContextPrefixInNamespace } from './helper/utils.js';

const findAllAssignments = (
  monaco: typeof Monaco,
  root: ASTChunk,
  document: Monaco.editor.ITextModel,
  isValid: (c: string) => boolean = () => true
): Monaco.languages.DocumentSymbol[] => {
  const scopes: ASTBaseBlockWithScope[] = [root, ...root.scopes];
  const result: Monaco.languages.DocumentSymbol[] = [];

  for (const item of scopes) {
    for (const assignmentItem of item.assignments) {
      const assignment = assignmentItem as ASTAssignmentStatement;
      const current = removeContextPrefixInNamespace(
        transformASTToString(assignment.variable)
      );

      if (!isValid(current)) {
        continue;
      }

      if (!assignment.variable.start || !assignment.variable.end) {
        continue;
      }

      const range = new monaco.Range(
        assignment.variable.start.line,
        assignment.variable.start.character,
        assignment.variable.end.line,
        assignment.variable.end.character
      );

      result.push({
        name: current,
        detail: current,
        kind: monaco.languages.SymbolKind.Variable,
        range,
        tags: [],
        selectionRange: range
      });
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

      return findAllAssignments(
        monaco,
        parseResult.document as ASTChunk,
        document
      );
    }
  });
}
