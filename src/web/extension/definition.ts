import {
  ASTBase,
  ASTBaseBlockWithScope,
  ASTIdentifier,
  ASTMemberExpression
} from 'miniscript-core';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';

const definitionLinkToString = (link: Monaco.languages.LocationLink): string => {
  return `${link.uri.toString()}#${link.range.startLineNumber}:${link.range.startColumn}-${link.range.endLineNumber}:${link.range.endColumn}`;
}

const findAllDefinitions = (
  monaco: typeof Monaco,
  helper: LookupHelper,
  item: ASTBase,
  root: ASTBaseBlockWithScope
): Monaco.languages.LocationLink[] => {
  const assignments = helper.findAllAssignmentsOfItem(item, root);
  const definitions: Monaco.languages.LocationLink[] = [];
  const visited = new Set<string>();

  for (const assignment of assignments) {
    const node = assignment.node;

    if (!node.start || !node.end) {
      continue;
    }

    const definitionLink: Monaco.languages.LocationLink = {
      uri: helper.document.uri,
      range: new monaco.Range(
        node.start.line,
        node.start.character,
        node.end.line,
        node.end.character
      )
    };
    const linkString = definitionLinkToString(definitionLink);

    if (visited.has(linkString)) {
      continue;
    }

    visited.add(linkString);
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
      let target: ASTBase = closest;

      if (previous) {
        if (
          previous instanceof ASTMemberExpression &&
          previous.identifier === closest
        ) {
          target = previous;
        }
      }

      const definitions = findAllDefinitions(
        monaco,
        helper,
        target,
        target.scope!
      );

      return definitions;
    }
  });
}
