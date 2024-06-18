import { SignatureDefinitionBaseType } from 'meta-utils';
import {
  ASTAssignmentStatement,
  ASTBase,
  ASTBaseBlockWithScope,
  ASTChunk,
  ASTIndexExpression,
  ASTMemberExpression,
  ASTType
} from 'miniscript-core';
import {
  CompletionItem,
  CompletionItemKind as EntityCompletionItemKind,
  Entity,
  IEntity
} from 'miniscript-type-analyzer';
import type {
  editor,
  Position
} from 'monaco-editor/esm/vs/editor/editor.api.js';

import * as ASTScraper from './ast-scraper.js';
import documentParseQueue from './model-manager.js';
import typeManager, { lookupBase } from './type-manager.js';
import { getTextDocument, TextDocument } from './vs.js';

export type LookupOuter = ASTBase[];

export interface LookupASTResult {
  closest: ASTBase;
  outer: LookupOuter;
}

export class LookupHelper {
  readonly document: TextDocument;

  constructor(document: editor.ITextModel) {
    this.document = getTextDocument(document);
  }

  findAllAssignmentsOfIdentifier(
    identifier: string,
    root: ASTBaseBlockWithScope
  ): ASTAssignmentStatement[] {
    return typeManager
      .get(this.document)
      .getScopeContext(root)
      .aggregator.resolveAvailableAssignmentsWithQuery(identifier);
  }

  findAllAssignmentsOfItem(
    item: ASTBase,
    root: ASTBaseBlockWithScope
  ): ASTAssignmentStatement[] {
    return typeManager
      .get(this.document)
      .getScopeContext(root)
      .aggregator.resolveAvailableAssignments(item);
  }

  findAllAvailableIdentifierInRoot(): Map<string, CompletionItem> {
    return typeManager
      .get(this.document)
      .getRootScopeContext()
      .scope.getAllIdentifier();
  }

  findAllPossibleProperties(): Map<string, CompletionItem> {
    return new Entity({
      document: typeManager.get(this.document),
      kind: EntityCompletionItemKind.Variable
    })
      .addType(SignatureDefinitionBaseType.Any)
      .getAllIdentifier();
  }

  findAllAvailableIdentifier(
    root: ASTBaseBlockWithScope
  ): Map<string, CompletionItem> {
    return typeManager
      .get(this.document)
      .getScopeContext(root)
      .scope.getAllIdentifier();
  }

  findAllAvailableIdentifierRelatedToPosition(
    item: ASTBase
  ): Map<string, CompletionItem> {
    const typeDoc = typeManager.get(this.document);
    const result: Map<string, CompletionItem> = new Map();
    const assignments = Array.from(
      typeDoc
        .getScopeContext(item.scope)
        .scope.locals.getAllIdentifier()
        .entries()
    )
      .map(([key, item]) => {
        return {
          identifier: key,
          ...item
        };
      })
      .sort((a, b) => a.line - b.line);

    for (let index = 0; index < assignments.length; index++) {
      const assignment = assignments[index];

      if (assignment.line >= item.end!.line) break;
      result.set(assignment.identifier, {
        kind: assignment.kind,
        line: assignment.line
      });
    }

    if (item.scope.scope) {
      const outerAssignments = typeDoc
        .getScopeContext(item.scope.scope)
        .scope.getAllIdentifier();

      for (const assignment of outerAssignments) {
        result.set(...assignment);
      }
    }

    return result;
  }

  lookupAST(position: Position): LookupASTResult | null {
    const me = this;
    const chunk = documentParseQueue.get(me.document).document as ASTChunk;
    const lineItems = chunk.lines.get(position.lineNumber);

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

  lookupBasePath(item: ASTBase): IEntity | null {
    const typeDoc = typeManager.get(this.document);

    if (typeDoc === null) {
      return null;
    }

    const base = lookupBase(item);

    if (base) {
      return typeDoc.resolveNamespace(base);
    }

    return null;
  }

  lookupTypeInfo({ closest, outer }: LookupASTResult): IEntity | null {
    const typeDoc = typeManager.get(this.document);

    if (typeDoc === null) {
      return null;
    }

    const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;

    if (
      previous?.type === ASTType.MemberExpression &&
      closest === (previous as ASTMemberExpression).identifier
    ) {
      return typeDoc.resolveType(previous, true);
    } else if (
      previous?.type === ASTType.IndexExpression &&
      closest === (previous as ASTIndexExpression).index &&
      closest.type === ASTType.StringLiteral
    ) {
      return typeDoc.resolveType(previous, true);
    }

    return typeDoc.resolveType(closest, true);
  }

  lookupType(position: Position): IEntity | null {
    const me = this;
    const astResult = me.lookupAST(position);

    // nothing to get info for
    if (!astResult) {
      return null;
    }

    return me.lookupTypeInfo(astResult);
  }
}
