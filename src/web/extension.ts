import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { activate as activateAutocomplete } from './extension/autocomplete';
import { activate as activateHover } from './extension/hover';

export function activate(monaco: typeof Monaco) {
  activateHover(monaco);
  activateAutocomplete(monaco);
}

export function deactivate() {}
