import {
  ASTBase,
  ASTIdentifier,
  ASTIndexExpression,
  ASTMemberExpression
} from 'miniscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import transformASTToNamespace from './helper/ast-namespace.js';
import { LookupHelper } from './helper/lookup-type.js';

const findAllDefinitions = (
  monaco: typeof Monaco,
  helper: LookupHelper,
  identifer: string,
  root: ASTBase
): Monaco.languages.LocationLink[] => {
  const assignments = helper.findAllAssignmentsOfIdentifier(identifer, root);
  const definitions: Monaco.languages.LocationLink[] = [];

  for (const assignment of assignments) {
    if (!assignment.start || !assignment.end) {
      continue;
    }

    const definitionLink: Monaco.languages.LocationLink = {
      uri: helper.document.uri,
      range: new monaco.Range(
        assignment.start.line,
        assignment.start.character,
        assignment.end.line,
        assignment.end.character
      )
    };

    definitions.push(definitionLink);
  }

  return definitions;
};

export function activate(monaco: typeof Monaco) {
  monaco.languages.registerDefinitionProvider('greyscript', {
    provideDefinition(
      document: Monaco.editor.ITextModel,
      position: Monaco.Position,
      _token: Monaco.CancellationToken
    ): Monaco.languages.ProviderResult<Monaco.languages.LocationLink[]> {
      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);

      if (!astResult) {
        return [];
      }

      const { outer, closest } = astResult;

      if (!(closest instanceof ASTIdentifier)) {
        return [];
      }

      const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;
      let identifer = closest.name;

      if (previous) {
        if (
          previous instanceof ASTMemberExpression &&
          previous.identifier === closest
        ) {
          identifer = transformASTToNamespace(previous);
        } else if (
          previous instanceof ASTIndexExpression &&
          previous.index === closest
        ) {
          identifer = transformASTToNamespace(previous);
        }
      }

      const definitions = findAllDefinitions(
        monaco,
        helper,
        identifer,
        closest.scope!
      );

      return definitions;
    }
  });
}
