import { ASTBase, ASTChunkAdvanced, Parser } from 'greybel-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

const activeDocumentASTMap: Map<string, ASTBase> = new Map();
const lastErrorsMap: Map<string, Error[]> = new Map();

// temporary solution
export const CACHE_KEY = 'anonymous';

export function createDocumentAST(document: Monaco.editor.ITextModel): {
  chunk: ASTBase;
  errors: Error[];
} {
  const content = document.getValue();
  const parser = new Parser(content, {
    unsafe: true
  });
  const chunk = parser.parseChunk();

  if ((chunk as ASTChunkAdvanced).body?.length > 0) {
    activeDocumentASTMap.set(CACHE_KEY, chunk);
    lastErrorsMap.set(CACHE_KEY, parser.errors);
  } else {
    try {
      const strictParser = new Parser(document.getValue());
      const strictChunk = strictParser.parseChunk();

      activeDocumentASTMap.set(CACHE_KEY, strictChunk);
      lastErrorsMap.set(CACHE_KEY, []);
    } catch (err: any) {
      lastErrorsMap.set(CACHE_KEY, [err]);
    }
  }

  return {
    chunk,
    errors: parser.errors
  };
}

export function clearDocumentAST(_document: Monaco.editor.ITextModel): void {
  activeDocumentASTMap.delete(CACHE_KEY);
  lastErrorsMap.delete(CACHE_KEY);
}

export function getLastDocumentASTErrors(
  document: Monaco.editor.ITextModel
): Error[] {
  return lastErrorsMap.get(CACHE_KEY) || createDocumentAST(document).errors;
}

export function getDocumentAST(document: Monaco.editor.ITextModel): ASTBase {
  return (
    activeDocumentASTMap.get(CACHE_KEY) || createDocumentAST(document).chunk
  );
}
