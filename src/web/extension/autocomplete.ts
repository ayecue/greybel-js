import { ASTCallExpression } from 'greybel-core';
import { ASTType } from 'greyscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {
  getDefinitions,
  SignatureDefinitionArg,
  SignatureDefinitionContainer
} from './grammar';
import {
  LookupHelper,
  TypeInfo,
  TypeInfoWithDefinition
} from './helper/lookup-type';
import {
  PseudoCompletionItem,
  PseudoCompletionList,
  PseudoSignatureHelp,
  PseudoSignatureInformation
} from './helper/vs';

export const convertDefinitionsToCompletionList = (
  definitions: SignatureDefinitionContainer,
  range: Monaco.Range
): PseudoCompletionItem[] => {
  const completionItems: PseudoCompletionItem[] = [];
  const keys = Object.keys(definitions);

  for (let index = 0; index < keys.length; index++) {
    completionItems.push(
      new PseudoCompletionItem({
        label: keys[index],
        kind: 0,
        insertText: keys[index],
        range
      })
    );
  }

  return completionItems;
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
      const currentRange = new monaco.Range(
        position.lineNumber,
        position.column - 1,
        position.lineNumber,
        position.column
      );

      const helper = new LookupHelper(monaco, document);
      const astResult = helper.lookupAST(position);

      if (astResult) {
        const { outer } = astResult;
        const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;

        if (
          previous?.type === ASTType.MemberExpression ||
          previous?.type === ASTType.IndexExpression
        ) {
          const base = helper.lookupBase(previous);
          const previousTypeInfo = helper.resolvePath(
            base!,
            outer.slice(0, -1)
          );

          if (previousTypeInfo instanceof TypeInfoWithDefinition) {
            const definitions = getDefinitions(
              previousTypeInfo.definition.returns
            );
            const completionItems: PseudoCompletionItem[] = [
              ...convertDefinitionsToCompletionList(definitions, currentRange)
            ];

            if (completionItems.length > 0) {
              return new PseudoCompletionList(completionItems).valueOf();
            }
          } else if (previousTypeInfo instanceof TypeInfo) {
            const definitions = getDefinitions(previousTypeInfo.type);
            const completionItems: PseudoCompletionItem[] = [
              ...convertDefinitionsToCompletionList(definitions, currentRange)
            ];

            if (completionItems.length > 0) {
              return new PseudoCompletionList(completionItems).valueOf();
            }
          }
        }
      }

      // get all default methods
      const defaultDefinitions = getDefinitions(['default']);
      const completionItems: PseudoCompletionItem[] = [
        ...convertDefinitionsToCompletionList(defaultDefinitions, currentRange)
      ];

      if (!astResult) {
        return new PseudoCompletionList(completionItems).valueOf();
      }

      // get all identifer available in scope
      completionItems.push(
        ...helper
          .findAllAvailableIdentifier(astResult.outer)
          .map((property: string) => {
            return new PseudoCompletionItem({
              label: property,
              kind: 0,
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
      const helper = new LookupHelper(monaco, document);
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

      const root = helper.lookupScope(astResult.outer);
      const item = helper.lookupTypeInfo({
        closest: rootCallExpression,
        outer: root ? [root] : []
      });

      if (!item || !(item instanceof TypeInfoWithDefinition)) {
        return;
      }

      // figure out argument position
      const astArgs = rootCallExpression.arguments;
      const selectedIndex = astArgs.findIndex((argItem) => {
        const leftIndex = argItem.start.character - 1;
        const rightIndex = argItem.end.character;

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
        (argItem) => {
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