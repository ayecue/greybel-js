import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { PseudoCompletionItem } from '../helper/vs.js';

export const AVAILABLE_CONSTANTS = [
  'true',
  'false',
  'null'
] as const;

export const getAvailableConstants = (
  range: Monaco.Range
): PseudoCompletionItem[] => {
  return AVAILABLE_CONSTANTS.map((label: string) => {
    return new PseudoCompletionItem({
      label,
      kind: 14,
      insertText: label,
      range
    });
  });
};
