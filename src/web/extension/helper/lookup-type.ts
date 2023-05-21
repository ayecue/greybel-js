import {
  ASTAssignmentStatement,
  ASTBase,
  ASTBaseBlockWithScope,
  ASTChunk,
  ASTFunctionStatement,
  ASTIdentifier,
  ASTType
} from 'greyscript-core';
import { editor, Position } from 'monaco-editor/esm/vs/editor/editor.api.js';

import * as ASTScraper from './ast-scraper.js';
import ASTStringify from './ast-stringify.js';
import documentParseQueue from './model-manager.js';
import typeManager, { lookupBase, TypeInfo } from './type-manager.js';

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
    root: ASTBase
  ): ASTAssignmentStatement[] {
    const assignments = this.lookupAssignments(root);
    const result: ASTAssignmentStatement[] = [];

    for (const item of assignments) {
      const current = ASTStringify(item.variable);

      if (current === identifier) {
        result.push(item);
      }
    }

    if (root instanceof ASTChunk) {
      const scopes: ASTBaseBlockWithScope[] = [root, ...root.scopes];

      for (const item of scopes) {
        for (const assignmentItem of item.assignments) {
          const assignment = assignmentItem as ASTAssignmentStatement;
          const current = ASTStringify(assignment.variable);

          if (!current.startsWith('globals.')) {
            continue;
          }

          if (current.replace(/^globals./, '') === identifier) {
            result.push(assignment);
          }
        }
      }
    }

    return result;
  }

  lookupAssignments(item: ASTBase): ASTAssignmentStatement[] {
    // lookup closest wrapping assignment
    const scopes = this.lookupScopes(item);
    const result: ASTAssignmentStatement[] = [];

    for (const scope of scopes) {
      result.push(...(scope.assignments as ASTAssignmentStatement[]));
    }

    return result;
  }

  findAllAvailableIdentifier(item: ASTBase): string[] {
    const scopes = this.lookupScopes(item);
    const result: string[] = [];

    for (const scope of scopes) {
      result.push(...scope.namespaces);
    }

    return Array.from(new Set(result));
  }

  findAllAvailableIdentifierRelatedToPosition(item: ASTBase): string[] {
    const scopes = this.lookupScopes(item);
    const result: string[] = [];
    const rootScope = scopes.shift();

    if (rootScope) {
      if (rootScope instanceof ASTFunctionStatement) {
        for (const parameter of rootScope.parameters) {
          if (parameter instanceof ASTAssignmentStatement) {
            result.push((parameter.variable as ASTIdentifier).name);
          } else if (parameter instanceof ASTIdentifier) {
            result.push(parameter.name);
          }
        }
      }

      for (const assignmentItem of rootScope.assignments) {
        const assignment = assignmentItem as ASTAssignmentStatement;

        if (assignment.end!.line >= item.end!.line) break;

        const current = ASTStringify(assignment.variable);
        result.push(current);
      }
    }

    for (const scope of scopes) {
      result.push(...scope.namespaces);
    }

    return Array.from(new Set(result));
  }

  lookupScope(item: ASTBase): ASTBaseBlockWithScope | null {
    return item.scope || null;
  }

  lookupScopes(item: ASTBase): ASTBaseBlockWithScope[] {
    const result: ASTBaseBlockWithScope[] = [];
    let current = item.scope;

    if (item instanceof ASTBaseBlockWithScope) {
      result.push(item);
    }

    while (current) {
      result.push(current);
      current = current.scope;
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

  lookupBasePath(item: ASTBase): TypeInfo | null {
    const base = lookupBase(item);
    const typeMap = typeManager.get(this.document);

    if (typeMap && base) {
      return typeMap.resolvePath(base);
    }

    return null;
  }

  lookupTypeInfo({ closest, outer }: LookupASTResult): TypeInfo | null {
    const typeMap = typeManager.get(this.document);

    if (!typeMap) {
      return null;
    }

    const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;

    if (
      previous?.type === ASTType.MemberExpression ||
      previous?.type === ASTType.IndexExpression
    ) {
      return typeMap.resolvePath(previous);
    }

    return typeMap.resolve(closest);
  }

  lookupType(position: Position): TypeInfo | null {
    const me = this;
    const astResult = me.lookupAST(position);

    // nothing to get info for
    if (!astResult) {
      return null;
    }

    return me.lookupTypeInfo(astResult);
  }
}
