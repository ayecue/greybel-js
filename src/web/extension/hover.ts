import { SignatureDefinitionTypeMeta } from 'meta-utils';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';
import { createHover, formatTypes } from './helper/tooltip.js';
import { PseudoHover, PseudoMarkdownString } from './helper/vs.js';

export function activate(monaco: typeof Monaco) {
  monaco.languages.registerHoverProvider('greyscript', {
    provideHover(
      document: Monaco.editor.ITextModel,
      position: Monaco.Position,
      _token: Monaco.CancellationToken
    ): Monaco.languages.ProviderResult<Monaco.languages.Hover> {
      const helper = new LookupHelper(document);
      const astResult = helper.lookupAST(position);

      if (!astResult) {
        return;
      }

      const typeInfo = helper.lookupTypeInfo(astResult);

      if (!typeInfo) {
        return;
      }

      const entity = helper.lookupTypeInfo(astResult);

      if (!entity) {
        return;
      }

      if (entity.isCallable()) {
        return createHover(entity).valueOf();
      }

      const hoverText = new PseudoMarkdownString('');
      const metaTypes = Array.from(entity.types).map(
        SignatureDefinitionTypeMeta.parse
      );

      hoverText.appendCodeblock(
        `(${entity.kind}) ${entity.label}: ${formatTypes(metaTypes)}`
      );

      return new PseudoHover([hoverText]).valueOf();
    }
  });
}
