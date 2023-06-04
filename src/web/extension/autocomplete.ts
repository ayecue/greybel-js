import {
  ASTBase,
  ASTCallExpression,
  ASTIndexExpression,
  ASTMemberExpression
} from 'greyscript-core';
import {
  getDefinitions,
  SignatureDefinitionArg,
  SignatureDefinitionContainer
} from 'greyscript-meta/dist/meta.js';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { getAvailableConstants } from './autocomplete/constants.js';
import { getAvailableKeywords } from './autocomplete/keywords.js';
import { getAvailableOperators } from './autocomplete/operators.js';
import transformASTToString from './helper/ast-stringify.js';
import { LookupHelper } from './helper/lookup-type.js';
import documentParseQueue from './helper/model-manager.js';
import { TypeInfo, TypeInfoWithDefinition } from './helper/type-manager.js';
import {
  PseudoCompletionItem,
  PseudoCompletionList,
  PseudoSignatureHelp,
  PseudoSignatureInformation
} from './helper/vs.js';

export const convertDefinitionsToCompletionList = (
  definitions: SignatureDefinitionContainer,
  range: Monaco.Range,
  kind: Monaco.languages.CompletionItemKind
): PseudoCompletionItem[] => {
  const completionItems: PseudoCompletionItem[] = [];
  const keys = Object.keys(definitions);

  for (let index = 0; index < keys.length; index++) {
    completionItems.push(
      new PseudoCompletionItem({
        label: keys[index],
        kind,
        insertText: keys[index],
        range
      })
    );
  }

  return completionItems;
};

export const getCompletionList = (
  helper: LookupHelper,
  item: ASTBase,
  range: Monaco.Range,
  kind: Monaco.languages.CompletionItemKind
): PseudoCompletionItem[] => {
  const typeInfo = helper.lookupBasePath(item);

  if (typeInfo instanceof TypeInfoWithDefinition) {
    const definitions = getDefinitions(typeInfo.definition.returns);
    const completionItems: PseudoCompletionItem[] = [
      ...convertDefinitionsToCompletionList(definitions, range, kind)
    ];

    if (completionItems.length > 0) {
      return completionItems;
    }
  } else if (typeInfo instanceof TypeInfo) {
    const definitions = getDefinitions(typeInfo.type);
    const completionItems: PseudoCompletionItem[] = [
      ...convertDefinitionsToCompletionList(definitions, range, kind)
    ];

    if (completionItems.length > 0) {
      return completionItems;
    }
  }

  return [];
};

export const getDefaultCompletionList = (
  range: Monaco.Range
): PseudoCompletionItem[] => {
  const defaultDefinitions = getDefinitions(['general']);

  return [
    ...getAvailableConstants(range),
    ...getAvailableKeywords(range),
    ...getAvailableOperators(range),
    ...convertDefinitionsToCompletionList(defaultDefinitions, range, 1)
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

      if (document.getValueInRange(currentRange) === '.') {
        const definitions = getDefinitions(['any']);
        const completionItems: PseudoCompletionItem[] = [
          ...convertDefinitionsToCompletionList(definitions, currentRange, 0)
        ];

        if (completionItems.length > 0) {
          return new PseudoCompletionList(completionItems).valueOf();
        }
      }

      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);
      const completionItems: PseudoCompletionItem[] = [];
      let base = '';

      if (astResult) {
        const { closest, outer } = astResult;
        const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;

        if (
          previous instanceof ASTMemberExpression &&
          closest === previous.identifier
        ) {
          base = transformASTToString(previous.base);
          completionItems.push(
            ...getCompletionList(helper, previous, currentRange, 0)
          );
        } else if (
          previous instanceof ASTIndexExpression &&
          closest === previous.index
        ) {
          base = transformASTToString(previous.base);
          completionItems.push(
            ...getCompletionList(helper, previous, currentRange, 0)
          );
        } else {
          completionItems.push(...getDefaultCompletionList(currentRange));
        }
      } else {
        completionItems.push(...getDefaultCompletionList(currentRange));
      }

      if (!astResult) {
        return new PseudoCompletionList(completionItems).valueOf();
      }

      const identifers = helper.findAllAvailableIdentifierRelatedToPosition(
        astResult.closest
      );

      // get all identifer available in scope but filtered by already existing base
      if (base.length > 0) {
        const baseStart = `${base}.`;
        const basePattern = new RegExp(`^${base}\\.`);

        completionItems.push(
          ...identifers
            .filter((property) => property.startsWith(baseStart))
            .map((property: string) => {
              const remainingValue = property.replace(basePattern, '');

              return new PseudoCompletionItem({
                label: remainingValue,
                kind: 4,
                insertText: remainingValue,
                range: currentRange
              });
            })
        );

        return new PseudoCompletionList(completionItems).valueOf();
      }

      // get all identifer available in scope
      completionItems.push(
        ...identifers.map((property: string) => {
          return new PseudoCompletionItem({
            label: property,
            kind: 4,
            insertText: property,
            range: currentRange
          });
        })
      );

      return new PseudoCompletionList(completionItems).valueOf();
    }
  });

  monaco.languages.registerSignatureHelpProvider('greyscript', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp(
      document: Monaco.editor.ITextModel,
      position: Monaco.Position,
      _token: Monaco.CancellationToken,
      _ctx: Monaco.languages.SignatureHelpContext
    ): Monaco.languages.ProviderResult<Monaco.languages.SignatureHelpResult> {
      documentParseQueue.refresh(document);
      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);

      if (!astResult) {
        return;
      }

      // filter out root call expression for signature
      let rootCallExpression: ASTCallExpression | undefined;

      if (astResult.closest.type === 'CallExpression') {
        rootCallExpression = astResult.closest as ASTCallExpression;
      } else {
        for (let index = astResult.outer.length - 1; index >= 0; index--) {
          const current = astResult.outer[index];

          if (current.type === 'CallExpression') {
            rootCallExpression = current as ASTCallExpression;
            break;
          }
        }
      }

      if (!rootCallExpression) {
        return;
      }

      const root = helper.lookupScope(astResult.closest);
      const item = helper.lookupTypeInfo({
        closest: rootCallExpression,
        outer: root ? [root] : []
      });

      if (!item || !(item instanceof TypeInfoWithDefinition)) {
        return;
      }

      // figure out argument position
      const astArgs = rootCallExpression.arguments;
      const selectedIndex = astArgs.findIndex((argItem: ASTBase) => {
        const leftIndex = argItem.start!.character - 1;
        const rightIndex = argItem.end!.character;

        return leftIndex <= position.column && rightIndex >= position.column;
      });

      const signatureHelp = new PseudoSignatureHelp();

      signatureHelp.activeParameter = selectedIndex === -1 ? 0 : selectedIndex;
      signatureHelp.signatures = [];
      signatureHelp.activeSignature = 0;

      const definition = item.definition;
      const args = definition.arguments || [];
      const returnValues = definition.returns.join(' or ') || 'null';
      const argValues = args
        .map(
          (item: SignatureDefinitionArg) =>
            `${item.label}${item.opt ? '?' : ''}: ${item.type}`
        )
        .join(', ');
      const params: Monaco.languages.ParameterInformation[] = args.map(
        (argItem: SignatureDefinitionArg) => {
          return {
            label: `${argItem.label}${argItem.opt ? '?' : ''}: ${argItem.type}`
          };
        }
      );

      const signatureInfo = new PseudoSignatureInformation(
        `(${item.type}) ${item.label} (${argValues}): ${returnValues}`,
        params
      );

      signatureHelp.add(signatureInfo);

      return signatureHelp.valueOf();
    }
  });
}
