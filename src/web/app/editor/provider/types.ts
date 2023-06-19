import monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export type Grammars = Record<string, GrammarItem>;

export interface GrammarItem {
  scopeName: string;
  tm: string;
  cfg?: string;
  extra?: monaco.languages.ILanguageExtensionPoint;
}

export type Themes = Record<string, string>;