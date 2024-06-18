import EventEmitter from 'events';
import { ASTChunkGreyScript, Parser } from 'greyscript-core';
import LRU from 'lru-cache';
import { ASTBase } from 'miniscript-core';
import type { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';

import typeManager from './type-manager.js';
import { getTextDocument, TextDocument } from './vs.js';

export interface ParseResult {
  content: string;
  textDocument: editor.ITextModel;
  document: ASTBase | null;
  errors: Error[];
}

export interface QueueItem {
  document: TextDocument;
  createdAt: number;
}

export const DOCUMENT_PARSE_QUEUE_INTERVAL = 1000;
export const DOCUMENT_PARSE_QUEUE_PARSE_TIMEOUT = 2000;

export class DocumentParseQueue extends EventEmitter {
  results: LRU<string, ParseResult>;

  private queue: Map<string, QueueItem>;
  private interval: NodeJS.Timeout | null;
  private readonly parseTimeout: number;

  constructor(parseTimeout: number = DOCUMENT_PARSE_QUEUE_PARSE_TIMEOUT) {
    super();
    this.results = new LRU({
      ttl: 1000 * 60 * 20,
      ttlAutopurge: true
    });
    this.queue = new Map();
    this.interval = setInterval(
      () => this.tick(),
      DOCUMENT_PARSE_QUEUE_INTERVAL
    );
    this.parseTimeout = parseTimeout;
  }

  private tick() {
    const currentTime = Date.now();

    for (const item of this.queue.values()) {
      if (currentTime - item.createdAt > this.parseTimeout) {
        this.refresh(item.document);
      }
    }
  }

  refresh(document: editor.ITextModel): ParseResult {
    const key = document.uri.path;

    if (!this.queue.has(key) && this.results.has(key)) {
      return this.results.get(key)!;
    }

    const result = this.create(document);
    this.results.set(key, result);
    this.emit('parsed', document, result);
    this.queue.delete(key);

    return result;
  }

  private create(document: editor.ITextModel): ParseResult {
    const content = document.getValue();
    const parser = new Parser(content, {
      unsafe: true
    });
    const chunk = parser.parseChunk();

    if ((chunk as ASTChunkGreyScript).body?.length > 0) {
      typeManager.analyze(
        getTextDocument(document),
        chunk as ASTChunkGreyScript
      );

      return {
        content,
        textDocument: document,
        document: chunk,
        errors: [...parser.lexer.errors, ...parser.errors]
      };
    }

    try {
      const strictParser = new Parser(document.getValue());
      const strictChunk = strictParser.parseChunk();

      typeManager.analyze(
        getTextDocument(document),
        strictChunk as ASTChunkGreyScript
      );

      return {
        content,
        textDocument: document,
        document: strictChunk,
        errors: []
      };
    } catch (err: any) {
      return {
        content,
        textDocument: document,
        document: null,
        errors: [err]
      };
    }
  }

  update(document: editor.ITextModel): boolean {
    const fileName = document.uri.path;
    const content = document.getValue();

    if (this.queue.has(fileName)) {
      return false;
    }

    if (this.results.get(fileName)?.content === content) {
      return false;
    }

    this.queue.set(fileName, {
      document: getTextDocument(document),
      createdAt: Date.now()
    });

    return true;
  }

  get(document: editor.ITextModel): ParseResult {
    return this.results.get(document.uri.path) || this.refresh(document);
  }

  clear(document: editor.ITextModel): void {
    this.results.delete(document.uri.path);
    this.emit('cleared', document);
  }
}

export default new DocumentParseQueue();
