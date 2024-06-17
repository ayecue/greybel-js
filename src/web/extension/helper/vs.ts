import type { editor, IMarkdownString, languages, IRange } from 'monaco-editor/esm/vs/editor/editor.api.js';

export interface TextDocument extends editor.ITextModel {
  fileName: string;
}

export function getTextDocument(document: editor.ITextModel): TextDocument {
  (document as any).fileName = 'default';
  return document as TextDocument;
}

export class PseudoMarkdownString {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  appendCodeblock(value: string): PseudoMarkdownString {
    this.value += `\`\`\`\n${value}\n\`\`\`\n`;
    return this;
  }

  appendMarkdown(value: string): PseudoMarkdownString {
    this.value += `${value}`;
    return this;
  }

  valueOf(): IMarkdownString {
    return {
      value: this.value
    };
  }
}

export class PseudoHover {
  markdowns: PseudoMarkdownString[];

  constructor(markdowns: PseudoMarkdownString[]) {
    this.markdowns = markdowns;
  }

  valueOf(): languages.Hover {
    return {
      contents: this.markdowns.map((it) => it.valueOf())
    };
  }
}

export class PseudoCompletionItem {
  label: string | languages.CompletionItemLabel;
  kind: languages.CompletionItemKind;
  insertText: string;
  range: IRange | languages.CompletionItemRanges;

  constructor(options: languages.CompletionItem) {
    this.label = options.label;
    this.kind = options.kind;
    this.insertText = options.insertText;
    this.range = options.range;
  }

  valueOf(): languages.CompletionItem {
    return {
      label: this.label,
      kind: this.kind,
      insertText: this.insertText,
      range: this.range
    };
  }
}

export class PseudoCompletionList {
  items: PseudoCompletionItem[];

  constructor(items: PseudoCompletionItem[]) {
    this.items = items;
  }

  valueOf(): languages.CompletionList {
    return {
      suggestions: this.items.map((item) => item.valueOf())
    };
  }
}

export class PseudoSignatureInformation {
  label: string;
  parameters: languages.ParameterInformation[];
  documentation: string | IMarkdownString;

  constructor(
    label: string,
    parameters: languages.ParameterInformation[],
    documentation: string | IMarkdownString
  ) {
    this.label = label;
    this.parameters = parameters;
    this.documentation = documentation;
  }

  valueOf(): languages.SignatureInformation {
    return {
      label: this.label,
      parameters: this.parameters,
      documentation: this.documentation
    };
  }
}

export class PseudoSignatureHelp {
  signatures: PseudoSignatureInformation[];
  activeParameter: number = 0;
  activeSignature: number = 0;

  constructor() {
    this.signatures = [];
  }

  add(item: PseudoSignatureInformation): PseudoSignatureHelp {
    this.signatures.push(item);
    return this;
  }

  valueOf(): languages.SignatureHelpResult {
    return {
      value: {
        signatures: this.signatures.map((item) => item.valueOf()),
        activeSignature: this.activeSignature,
        activeParameter: this.activeParameter
      },
      dispose: () => { }
    };
  }
}
