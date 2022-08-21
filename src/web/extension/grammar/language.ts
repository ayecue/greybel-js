import { allTypes, getDefinitions } from 'greyscript-meta';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

const language: Monaco.languages.IMonarchLanguage = {
  // setup via https://microsoft.github.io/monaco-editor/monarch.html
  keywords: [
    'continue',
    'for',
    'new',
    'if',
    'self',
    'break',
    'else',
    'return',
    'while',
    'true',
    'false',
    'not',
    'and',
    'or',
    'end',
    'then',
    'function',
    'in'
  ],
  operators: [
    '=',
    '>',
    '<',
    '~',
    ':',
    '==',
    '<=',
    '>=',
    '!=',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '^',
    '%',
    'and',
    'or',
    '<<',
    '>>',
    '>>>',
    '+=',
    '-=',
    '*=',
    '/='
  ],

  symbols: /[+\-*/^@]+/,

  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.array' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
    { open: 'for', close: 'end', token: 'delimiter.bracket' }
  ],

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // identifiers and keywords
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            'end (if|while|for|function)': {
              token: 'keyword.decl',
              bracket: '@close'
            },
            'if|while|for|function': {
              token: 'keyword.decl',
              bracket: '@open'
            },
            [[...allTypes.filter((item: string) => item !== 'general'), 'any', 'number', 'null', 'boolean'].join('|')]:
              'type',
            debugger: 'debug-token',
            default: 'constant',
            [Object.keys(getDefinitions(['general'])).join('|')]:
              'variable.name',
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }
      ],
      [/[A-Z][\w$]*/, 'type.identifier'], // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

      // strings
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // delimiter and brackets
      [/[;,.]/, 'delimiter']
    ],

    string: [
      [/[^"]+/, 'string'],
      [/""/, 'string.escape'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\/.*$/, 'comment']
    ]
  }
};

export default language;
