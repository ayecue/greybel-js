import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { LookupHelper } from './helper/lookup-type.js';
import { createHover } from './helper/tooltip.js';
import { TypeInfoWithDefinition } from './helper/type-manager.js';
import { PseudoHover, PseudoMarkdownString } from './helper/vs.js';

function formatType(type: string): string {
  const segments = type.split(':');
  if (segments.length === 1) {
    return segments[0];
  }
  return `${segments[0]}<${segments[1]}>`;
}

function formatTypes(types: string[] = []): string {
  return types.map(formatType).join(' or ');
}

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

      const hoverText = new PseudoMarkdownString('');

      if (typeInfo instanceof TypeInfoWithDefinition) {
        return createHover(typeInfo).valueOf();
      }

      hoverText.appendCodeblock(
        `(${typeInfo.kind}) ${typeInfo.label}: ${formatTypes(typeInfo.type)}`
      );
      return new PseudoHover(hoverText).valueOf();
    }
  });
}
