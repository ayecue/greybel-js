import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { activate as activateAutocomplete } from './extension/autocomplete';
import { activate as activateDefinition } from './extension/definition';
import { activate as activateHover } from './extension/hover';

export function activate(monaco: typeof Monaco) {
  activateHover(monaco);
  activateAutocomplete(monaco);
  activateDefinition(monaco);
}

export function deactivate() {}
