import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

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

  valueOf(): Monaco.IMarkdownString {
    return {
      value: this.value
    };
  }
}

export class PseudoHover {
  markdown: PseudoMarkdownString;

  constructor(markdown: PseudoMarkdownString) {
    this.markdown = markdown;
  }

  valueOf(): Monaco.languages.Hover {
    return {
      contents: [this.markdown.valueOf()]
    };
  }
}

export class PseudoCompletionItem {
  label: string | Monaco.languages.CompletionItemLabel;
  kind: Monaco.languages.CompletionItemKind;
  insertText: string;
  range: Monaco.IRange | Monaco.languages.CompletionItemRanges;

  constructor(options: Monaco.languages.CompletionItem) {
    this.label = options.label;
    this.kind = options.kind;
    this.insertText = options.insertText;
    this.range = options.range;
  }

  valueOf(): Monaco.languages.CompletionItem {
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

  valueOf(): Monaco.languages.CompletionList {
    return {
      suggestions: this.items.map((item) => item.valueOf())
    };
  }
}

export class PseudoSignatureInformation {
  label: string;
  parameters: Monaco.languages.ParameterInformation[];

  constructor(
    label: string,
    parameters: Monaco.languages.ParameterInformation[]
  ) {
    this.label = label;
    this.parameters = parameters;
  }

  valueOf(): Monaco.languages.SignatureInformation {
    return {
      label: this.label,
      parameters: this.parameters
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

  valueOf(): Monaco.languages.SignatureHelpResult {
    return {
      value: {
        signatures: this.signatures.map((item) => item.valueOf()),
        activeSignature: this.activeSignature,
        activeParameter: this.activeParameter
      },
      dispose: () => {}
    };
  }
}
