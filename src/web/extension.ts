import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { activate as activateAutocomplete } from './extension/autocomplete';
import { activate as activateDefinition } from './extension/definition';
import { activate as activateHover } from './extension/hover';
import { activate as activateSymbol } from './extension/symbol';

export function activate(monaco: typeof Monaco) {
  activateHover(monaco);
  activateAutocomplete(monaco);
  activateDefinition(monaco);
  activateSymbol(monaco);
}

export function deactivate() {}
