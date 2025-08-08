import {
  CompletionItem,
  IResolveNamespaceResult,
  IType,
  SymbolInfo
} from 'greybel-type-analyzer';
import {
  ASTBase,
  ASTBaseBlockWithScope,
  ASTChunk,
  ASTIndexExpression,
  ASTMemberExpression,
  ASTType
} from 'miniscript-core';
import type {
  editor,
  Position
} from 'monaco-editor/esm/vs/editor/editor.api.js';

import * as ASTScraper from './ast-scraper.js';
import { isValidIdentifierLiteral } from './is-valid-identifier-literal.js';
import documentParseQueue from './model-manager.js';
import typeManager, { lookupBase } from './type-manager.js';

export type LookupOuter = ASTBase[];

export interface LookupASTResult {
  closest: ASTBase;
  outer: LookupOuter;
}

export class LookupHelper {
  readonly document: editor.ITextModel;

  constructor(document: editor.ITextModel) {
    this.document = document;
  }

  findAllAssignmentsOfIdentifier(
    identifier: string,
    root: ASTBaseBlockWithScope
  ): SymbolInfo[] {
    const typeDoc = typeManager.get(this.document.uri.fsPath);
    const context = typeDoc.scopeRefMapping.get(root);

    if (context == null) {
      return [];
    }

    return context.scope.resolveAllAvailableWithQuery(identifier);
  }

  findAllAssignmentsOfItem(item: ASTBase): IType {
    const typeDoc = typeManager.get(this.document.uri.fsPath);
    const result = typeDoc.resolveNamespace(item, false);

    if (result == null) {
      return null;
    }

    return result.item;
  }

  findAllAvailableIdentifierInRoot(): Map<string, CompletionItem> {
    const typeDoc = typeManager.get(this.document.uri.fsPath);

    return typeDoc.globals.getAllProperties().reduce((result, it) => {
      const sources = it.type.getSource();

      result.set(it.name, {
        kind: it.kind,
        line: sources && sources.length > 0 ? sources[0].start.line - 1 : -1
      });
      return result;
    }, new Map<string, CompletionItem>());
  }

  findAllAvailableIdentifier(
    root: ASTBaseBlockWithScope
  ): Map<string, CompletionItem> {
    const typeDoc = typeManager.get(this.document.uri.fsPath);
    const context = typeDoc.scopeRefMapping.get(root);

    if (context == null) {
      return new Map();
    }

    return context.scope.getAllProperties().reduce((result, it) => {
      const sources = it.type.getSource();

      result.set(it.name, {
        kind: it.kind,
        line: sources && sources.length > 0 ? sources[0].start.line - 1 : -1
      });
      return result;
    }, new Map<string, CompletionItem>());
  }

  findAllAvailableIdentifierRelatedToPosition(
    item: ASTBase
  ): Map<string, CompletionItem> {
    const typeDoc = typeManager.get(this.document.uri.fsPath);
    const result: Map<string, CompletionItem> = new Map();
    const scopeContext = typeDoc.scopeRefMapping.get(item.scope);
    const properties = scopeContext.scope.getAllProperties();
    const alwaysVisibleProperties = [];
    const locationDependendProperties = [];

    for (let index = 0; index < properties.length; index++) {
      const property = properties[index];
      const sources = property.type.getSource();

      if (
        property.type.document != null &&
        property.type.document.name === typeDoc.name &&
        sources != null &&
        sources.length > 0
      ) {
        locationDependendProperties.push(property);
      } else {
        alwaysVisibleProperties.push(property);
      }
    }

    for (let index = 0; index < alwaysVisibleProperties.length; index++) {
      const property = alwaysVisibleProperties[index];
      result.set(property.name, {
        kind: property.kind,
        line: -1
      });
    }

    locationDependendProperties.sort(
      (a, b) =>
        a.type.getSource()[0].start.line - b.type.getSource()[0].start.line
    );

    for (let index = 0; index < locationDependendProperties.length; index++) {
      const property = locationDependendProperties[index];
      const source = property.type.getSource()[0];

      if (source.start.line >= item.end!.line) break;
      result.set(property.name, {
        kind: property.kind,
        line: source.start.line - 1
      });
    }

    return result;
  }

  lookupAST(position: Position): LookupASTResult | null {
    const me = this;
    const chunk = documentParseQueue.get(me.document).document as ASTChunk;
    const lineItems = chunk.lines[position.lineNumber];

    if (!lineItems) {
      return null;
    }

    for (let index = 0; index < lineItems.length; index++) {
      const lineItem = lineItems[index];
      const outer = ASTScraper.findEx((item: ASTBase, _level: number) => {
        const startLine = item.start!.line;

        if (startLine > position.lineNumber) {
          return {
            exit: true
          };
        }

        const startCharacter = item.start!.character;
        const endLine = item.end!.line;
        const endCharacter = item.end!.character;

        if (startLine < endLine) {
          return {
            valid:
              (position.lineNumber > startLine &&
                position.lineNumber < endLine) ||
              (position.lineNumber === startLine &&
                startCharacter <= position.column) ||
              (position.lineNumber === endLine &&
                endCharacter >= position.column)
          };
        }

        return {
          valid:
            startLine <= position.lineNumber &&
            startCharacter <= position.column &&
            endLine >= position.lineNumber &&
            endCharacter >= position.column
        };
      }, lineItem) as LookupOuter;
      // get closest AST
      const closest = outer.pop();

      // nothing to get info for
      if (!closest) {
        continue;
      }

      return {
        closest,
        outer
      };
    }

    return null;
  }

  lookupBasePath(item: ASTBase): IResolveNamespaceResult | null {
    const typeDoc = typeManager.get(this.document.uri.fsPath);

    if (typeDoc === null) {
      return null;
    }

    const base = lookupBase(item);

    if (base) {
      return typeDoc.resolveNamespace(base, true);
    }

    return null;
  }

  lookupTypeInfo({
    closest,
    outer
  }: LookupASTResult): IResolveNamespaceResult | null {
    const typeDoc = typeManager.get(this.document.uri.fsPath);

    if (typeDoc === null) {
      return null;
    }

    const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;

    if (
      previous?.type === ASTType.MemberExpression &&
      closest === (previous as ASTMemberExpression).identifier
    ) {
      return typeDoc.resolveNamespace(previous, false);
    } else if (
      previous?.type === ASTType.IndexExpression &&
      closest === (previous as ASTIndexExpression).index &&
      isValidIdentifierLiteral(closest)
    ) {
      return typeDoc.resolveNamespace(previous, false);
    }

    return typeDoc.resolveNamespace(closest, false);
  }

  lookupType(position: Position): IResolveNamespaceResult | null {
    const me = this;
    const astResult = me.lookupAST(position);

    // nothing to get info for
    if (!astResult) {
      return null;
    }

    return me.lookupTypeInfo(astResult);
  }
}
