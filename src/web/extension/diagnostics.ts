import { ASTRange } from 'miniscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import documentParseQueue from './helper/model-manager.js';

function lookupErrors(
  monaco: typeof Monaco,
  document: Monaco.editor.ITextModel
): Monaco.editor.IMarkerData[] {
  const errors = documentParseQueue.get(document).errors;

  return errors.map((err: any) => {
    // Lexer error and Parser error
    if (err?.range) {
      const range: ASTRange = err.range;
      return {
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: range.start.line,
        startColumn: range.start.character,
        endLineNumber: range.end.line,
        endColumn: range.end.character,
        message: err.message
      };
    }

    return {
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: 0,
      startColumn: 0,
      endLineNumber: document.getLineCount(),
      endColumn: document.getLineContent(document.getLineCount()).length - 1,
      message: err.message
    };
  });
}

export function activate(monaco: typeof Monaco) {
  documentParseQueue.on('parsed', (document: Monaco.editor.ITextModel) => {
    const markers = lookupErrors(monaco, document);
    monaco.editor.setModelMarkers(document, 'greyscript', markers);
  });

  documentParseQueue.on('cleared', (document: Monaco.editor.ITextModel) => {
    monaco.editor.setModelMarkers(document, 'greyscript', []);
  });
}
