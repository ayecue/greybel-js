import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { activate as activateAutocomplete } from './extension/autocomplete.js';
import { activate as activateDefinition } from './extension/definition.js';
import { activate as activateDiagnostics } from './extension/diagnostics.js';
import { activate as activateHover } from './extension/hover.js';
import { activate as activateSymbol } from './extension/symbol.js';

export function activate(monaco: typeof Monaco) {
  activateHover(monaco);
  activateAutocomplete(monaco);
  activateDefinition(monaco);
  activateSymbol(monaco);
  activateDiagnostics(monaco);
}

export function deactivate() {}
