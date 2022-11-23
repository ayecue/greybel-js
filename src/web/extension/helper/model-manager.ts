import EventEmitter from 'events';
import { ASTChunkAdvanced, Parser } from 'greybel-core';
import { ASTBase } from 'greyscript-core';
import LRU from 'lru-cache';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

export interface ParseResult {
  document: ASTBase | null;
  errors: Error[];
}

export interface QueueItem {
  document: editor.ITextModel;
  createdAt: number;
}

export const DOCUMENT_PARSE_QUEUE_INTERVAL = 1000;
export const DOCUMENT_PARSE_QUEUE_PARSE_TIMEOUT = 5000;

export class DocumentParseQueue extends EventEmitter {
  results: LRU<string, ParseResult>;

  private queue: Map<string, QueueItem>;
  private interval: NodeJS.Timeout | null;
  private readonly parseTimeout: number;

  constructor(parseTimeout: number = DOCUMENT_PARSE_QUEUE_PARSE_TIMEOUT) {
    super();
    this.results = new LRU({
      ttl: 1000 * 60 * 20
    });
    this.queue = new Map();
    this.interval = null;
    this.parseTimeout = parseTimeout;
  }

  private resume() {
    if (this.queue.size === 0 || this.interval !== null) {
      return;
    }

    const next = () => {
      const currentTime = Date.now();

      for (const item of this.queue.values()) {
        if (currentTime - item.createdAt > this.parseTimeout) {
          this.refresh(item.document);
        }
      }

      if (this.queue.size > 0) {
        this.interval = setTimeout(next, DOCUMENT_PARSE_QUEUE_INTERVAL);
        return;
      }

      this.interval = null;
    };

    this.interval = setTimeout(next, DOCUMENT_PARSE_QUEUE_INTERVAL);
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

    if ((chunk as ASTChunkAdvanced).body?.length > 0) {
      return {
        document: chunk,
        errors: parser.errors
      };
    }

    try {
      const strictParser = new Parser(document.getValue());
      const strictChunk = strictParser.parseChunk();

      return {
        document: strictChunk,
        errors: []
      };
    } catch (err: any) {
      console.log('refresh err', err);

      return {
        document: null,
        errors: [err]
      };
    }
  }

  update(document: editor.ITextModel): boolean {
    const fileName = document.uri.path;

    if (this.queue.has(fileName)) {
      return false;
    }

    this.queue.set(fileName, {
      document,
      createdAt: Date.now()
    });

    this.resume();

    return true;
  }

  get(document: editor.ITextModel): ParseResult {
    return this.results.get(document.uri.path) || this.refresh(document);
  }

  clear(document: editor.ITextModel): void {
    this.results.delete(document.uri.path);
  }
}

export default new DocumentParseQueue();
