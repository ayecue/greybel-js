import { allTypes, getDefinitions } from 'greyscript-meta/dist/meta.js';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

const language: Monaco.languages.IMonarchLanguage = {
  // setup via https://microsoft.github.io/monaco-editor/monarch.html
  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.array' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' }
  ],

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // identifiers and keywords
      { include: '@keywords' },
      { include: '@identifier' },
      [ /[A-Z][\w$]*/, 'type.identifier'], // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      { include: '@operator' },

      // strings
      [ /"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // numbers
      { include: '@number' },

      // delimiter and brackets
      [ /[;,.]/, 'delimiter']
    ],

    keywords: [
      [/\b(if|then|end|else|function|in|while|for|from)\b/, 'keyword'],
      [/\b(return|continue|break)\b/, 'keyword'],
      [/\b(and|or|not|new|isa)\b/, 'keyword'],
      [/#(include|import|envar)\b/, 'keyword'],
      [/(?<=end )\b(if|while|for|function)\b/, {
        token: 'keyword.decl',
        bracket: '@close'
      }],
      [/(?<!end )\b(if|while|for|function)\b/, {
        token: 'keyword.decl',
        bracket: '@open'
      }]
    ],

    operator: [
      [/([+\-*\/^<>|\&]|[<>=!]=|<<|>>>?)/, 'operator']
    ],

    identifier: [
      [/[a-z_$][\w$]*/, {
        cases: {
          debugger: 'debug-token',
          null: 'constant',
          false: 'constant',
          true: 'constant',
          number: 'type',
          map: 'type',
          list: 'type',
          string: 'type',
          [Object.keys(getDefinitions(['general'])).join('|')]:
            'variable.name',
          '@default': 'identifier'
        }
      }]
    ],

    string: [
      [/[^"]+/, 'string'],
      [/""/, 'string.escape'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment']
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ['\\*/', 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],

    number: [
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],
    ]
  }
};

export default language;
