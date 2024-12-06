import {
  SignatureDefinitionBaseType,
  SignatureDefinitionTypeMeta
} from 'meta-utils';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';
import { createHover, formatKind, formatTypes } from './helper/tooltip.js';
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
      let label = `(${formatKind(entity.kind)}) ${entity.label}: ${formatTypes(metaTypes)}`;

      if (entity.types.has(SignatureDefinitionBaseType.Map)) {
        const records: Record<string, string> = {};

        for (const [key, item] of entity.values) {
          const metaTypes = Array.from(item.types).map(
            SignatureDefinitionTypeMeta.parse
          );
          records[key.slice(2)] = formatTypes(metaTypes);
        }

        label += ' ' + JSON.stringify(records, null, 2);
      }

      hoverText.appendCodeblock(label);

      return new PseudoHover([hoverText]).valueOf();
    }
  });
}
