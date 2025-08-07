import { isFunctionType, isUnionType } from 'greybel-type-analyzer';
import { SignatureDefinitionTypeMeta } from 'meta-utils';
import type Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';
import {
  createHover,
  createTypeBody,
  formatKind,
  formatTypes
} from './helper/tooltip.js';
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

      const entity = helper.lookupTypeInfo(astResult);

      if (!entity) {
        return;
      }

      if (
        isFunctionType(entity.item) ||
        (isUnionType(entity.item) && entity.item.variants.some(isFunctionType))
      ) {
        return createHover(entity).valueOf();
      }

      const hoverText = new PseudoMarkdownString('');
      const metaTypes = entity.item
        .toMeta()
        .map(SignatureDefinitionTypeMeta.parse);
      const displayName = entity.value
        ? entity.value.length > 10
          ? `${entity.value.slice(0, 10)}...${
              entity.value.startsWith('"') ? '"' : ''
            }`
          : entity.value
        : entity.path;
      let label = `(${formatKind(
        entity.completionItemKind
      )}) ${displayName}: ${formatTypes(metaTypes)}`;
      const labelBody = createTypeBody(entity.item);

      if (labelBody) {
        label += ` ${JSON.stringify(labelBody, null, 2)}`;
      }

      hoverText.appendCodeblock(label);

      return new PseudoHover([hoverText]).valueOf();
    }
  });
}
