import monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export interface GrammarItem {
  scopeName: string;
  tm: string;
  cfg?: string;
  extra?: monaco.languages.ILanguageExtensionPoint;
}

export type Grammars = Record<string, GrammarItem>;
export type Themes = Record<string, string>;
