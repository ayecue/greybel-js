import { ASTBase, ASTCallExpression, ASTType } from 'miniscript-core';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupASTResult, LookupHelper } from './helper/lookup-type.js';
import documentParseQueue from './helper/model-manager.js';
import { createSignatureInfo } from './helper/tooltip.js';
import { PseudoSignatureHelp } from './helper/vs.js';

const getClosestCallExpression = (
  astResult: LookupASTResult
): ASTCallExpression | null => {
  if (astResult.closest.type === ASTType.CallExpression) {
    return astResult.closest as ASTCallExpression;
  }

  for (let index = astResult.outer.length - 1; index >= 0; index--) {
    const current = astResult.outer[index];

    if (current.type === ASTType.CallExpression) {
      return current as ASTCallExpression;
    }
  }

  return null;
};

export function activate(monaco: typeof Monaco) {
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
      const { closest } = astResult;
      const closestCallExpr = getClosestCallExpression(astResult);

      if (closestCallExpr === null) {
        return;
      }

      const item = helper.lookupTypeInfo({
        closest: closestCallExpr.base,
        outer: closest.scope ? [closest.scope] : []
      });

      if (!item || !item.isCallable()) {
        return;
      }

      // figure out argument position
      const astArgs = closestCallExpr.arguments;
      const selectedIndex = astArgs.findIndex((argItem: ASTBase) => {
        const leftIndex = argItem.start!.character - 1;
        const rightIndex = argItem.end!.character;

        return leftIndex <= position.column && rightIndex >= position.column;
      });

      const signatureHelp = new PseudoSignatureHelp();

      signatureHelp.activeParameter = selectedIndex === -1 ? 0 : selectedIndex;
      signatureHelp.signatures = [];
      signatureHelp.activeSignature = 0;
      signatureHelp.signatures.push(...createSignatureInfo(item));

      return signatureHelp.valueOf();
    }
  });
}
