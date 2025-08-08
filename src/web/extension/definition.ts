import { TypeSource } from 'greybel-type-analyzer';
import {
  ASTBase,
  ASTBaseBlockWithScope,
  ASTForGenericStatement,
  ASTIdentifier,
  ASTMemberExpression,
  ASTType
} from 'miniscript-core';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';

const definitionLinkToString = (
  link: Monaco.languages.LocationLink
): string => {
  return `${link.uri.toString()}#${link.range.startLineNumber}:${
    link.range.startColumn
  }-${link.range.endLineNumber}:${link.range.endColumn}`;
};

const getLocation = (
  monaco: typeof Monaco,
  helper: LookupHelper,
  item: TypeSource
): Monaco.languages.LocationLink => {
  const node = item.astRef;
  let range: Monaco.Range;
  switch (node.type) {
    case ASTType.ForGenericStatement: {
      const stmt = node as ASTForGenericStatement;
      range = new monaco.Range(
        stmt.variable.start.line,
        stmt.variable.start.character,
        stmt.variable.end.line,
        stmt.variable.end.character
      );
      break;
    }
    default: {
      range = new monaco.Range(
        node.start.line,
        node.start.character,
        node.end.line,
        node.end.character
      );
    }
  }
  return {
    uri: helper.document.uri,
    range
  };
};

const findAllDefinitions = (
  monaco: typeof Monaco,
  helper: LookupHelper,
  item: ASTBase,
  root: ASTBaseBlockWithScope
): Monaco.languages.LocationLink[] => {
  const result = helper.findAllAssignmentsOfItem(item);
  const sources = result?.getSource();

  if (sources == null || sources.length === 0) {
    return [];
  }

  const definitions: Monaco.languages.LocationLink[] = [];
  const visited = new Set<string>();

  for (const source of sources) {
    const node = source.astRef;

    if (!node.start || !node.end) {
      continue;
    }

    const definitionLink = getLocation(monaco, helper, source);
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
