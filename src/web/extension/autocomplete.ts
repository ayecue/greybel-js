import {
  CompletionItem,
  CompletionItem as EntityCompletionItem
} from 'greybel-type-analyzer';
import {
  ASTBase,
  ASTIdentifier,
  ASTIndexExpression,
  ASTMemberExpression
} from 'miniscript-core';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { getAvailableConstants } from './autocomplete/constants.js';
import { getAvailableKeywords } from './autocomplete/keywords.js';
import { getAvailableOperators } from './autocomplete/operators.js';
import { getCompletionItemKind } from './helper/kind.js';
import { LookupHelper } from './helper/lookup-type.js';
import documentParseQueue from './helper/model-manager.js';
import { PseudoCompletionItem, PseudoCompletionList } from './helper/vs.js';

export const transformToCompletionItems = (
  identifer: Map<string, EntityCompletionItem>,
  range: Monaco.Range
) => {
  const items: PseudoCompletionItem[] = [];

  for (const [property, item] of identifer) {
    items.push(
      new PseudoCompletionItem({
        label: property,
        kind: getCompletionItemKind(item.kind),
        insertText: property,
        range
      })
    );
  }

  return items;
};

export const getPropertyCompletionList = (
  helper: LookupHelper,
  range: Monaco.Range,
  item: ASTBase
): PseudoCompletionItem[] => {
  const entity = helper.lookupBasePath(item);

  if (entity === null) {
    return [];
  }

  const items = entity.item.getAllProperties().reduce((result, it) => {
    const sources = it.type.getSource();

    result.set(it.name, {
      kind: it.kind,
      line: sources && sources.length > 0 ? sources[0].start.line - 1 : -1
    });
    return result;
  }, new Map<string, CompletionItem>());

  return transformToCompletionItems(items, range);
};

export const getDefaultCompletionList = (
  range: Monaco.Range
): PseudoCompletionItem[] => {
  return [
    ...getAvailableConstants(range),
    ...getAvailableKeywords(range),
    ...getAvailableOperators(range)
  ];
};

export function activate(monaco: typeof Monaco) {
  monaco.languages.registerCompletionItemProvider('greyscript', {
    triggerCharacters: ['.'],
    provideCompletionItems(
      document: Monaco.editor.ITextModel,
      position: Monaco.Position,
      _ctx: Monaco.languages.CompletionContext,
      _token: Monaco.CancellationToken
    ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> {
      documentParseQueue.refresh(document);
      const currentRange = new monaco.Range(
        position.lineNumber,
        position.column - 1,
        position.lineNumber,
        position.column
      );

      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);
      const completionItems: PseudoCompletionItem[] = [];
      let isProperty = false;

      if (astResult) {
        const { closest, outer } = astResult;
        const previous = outer.length > 0 ? outer[outer.length - 1] : null;

        if (closest instanceof ASTMemberExpression) {
          completionItems.push(
            ...getPropertyCompletionList(helper, currentRange, closest)
          );
          isProperty = true;
        } else if (closest instanceof ASTIndexExpression) {
          completionItems.push(
            ...getPropertyCompletionList(helper, currentRange, closest)
          );
          isProperty = true;
        } else if (
          closest instanceof ASTIdentifier &&
          previous instanceof ASTMemberExpression
        ) {
          completionItems.push(
            ...getPropertyCompletionList(helper, currentRange, previous)
          );
          isProperty = true;
        } else {
          completionItems.push(...getDefaultCompletionList(currentRange));
        }
      } else {
        completionItems.push(...getDefaultCompletionList(currentRange));
        completionItems.push(
          ...transformToCompletionItems(
            helper.findAllAvailableIdentifierInRoot(),
            currentRange
          )
        );
      }

      if (!astResult || isProperty) {
        return new PseudoCompletionList(completionItems).valueOf();
      }

      // get all identifer available in scope
      completionItems.push(
        ...transformToCompletionItems(
          helper.findAllAvailableIdentifierRelatedToPosition(astResult.closest),
          currentRange
        )
      );

      return new PseudoCompletionList(completionItems).valueOf();
    }
  });
}
