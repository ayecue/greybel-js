import { ASTBase, ASTIdentifier, ASTMemberExpression } from 'greyscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import ASTStringify from './helper/ast-stringify';
import { LookupHelper } from './helper/lookup-type';

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
      const helper = new LookupHelper(monaco, document);
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

      if (previous && previous instanceof ASTMemberExpression) {
        identifer = ASTStringify(previous);
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
