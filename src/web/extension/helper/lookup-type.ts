import { ASTChunkAdvanced } from 'greybel-core';
import {
  ASTAssignmentStatement,
  ASTBase,
  ASTBaseBlockWithScope,
  ASTChunk,
  ASTFunctionStatement,
  ASTIdentifier,
  ASTIndexExpression,
  ASTMapConstructorExpression,
  ASTMemberExpression,
  ASTType
} from 'greyscript-core';
import { editor, Position } from 'monaco-editor/esm/vs/editor/editor.api.js';

import transformASTToNamespace from './ast-namespace.js';
import * as ASTScraper from './ast-scraper.js';
import transformASTToString from './ast-stringify.js';
import documentParseQueue from './model-manager.js';
import typeManager, { lookupBase, TypeInfo } from './type-manager.js';
import {
  isGlobalsContextNamespace,
  removeContextPrefixInNamespace,
  removeGlobalsContextPrefixInNamespace
} from './utils.js';

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
    const identiferWithoutPrefix = removeContextPrefixInNamespace(identifier);
    const assignments = [...this.lookupAssignments(root)];
    const result: ASTAssignmentStatement[] = [];

    for (let index = 0; index < assignments.length; index++) {
      const assignment = assignments[index] as ASTAssignmentStatement;
      const current = removeContextPrefixInNamespace(
        transformASTToNamespace(assignment.variable)
      );

      if (current === identiferWithoutPrefix) {
        result.push(assignment);
      }
    }

    if (root instanceof ASTChunk) {
      const scopes: ASTBaseBlockWithScope[] = [root, ...root.scopes];

      for (const item of scopes) {
        const assignments = [...item.assignments];

        for (let index = 0; index < assignments.length; index++) {
          const assignment = assignments[index] as ASTAssignmentStatement;
          const current = transformASTToNamespace(assignment.variable);

          if (!isGlobalsContextNamespace(current)) {
            continue;
          }

          if (
            removeGlobalsContextPrefixInNamespace(current) ===
            identiferWithoutPrefix
          ) {
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
    const outerScope = scopes.length > 1 ? scopes[1] : null;
    const globalScope = this.lookupGlobalScope(item);

    for (const scope of scopes) {
      const assignments = [...scope.assignments];

      for (let index = 0; index < assignments.length; index++) {
        const assignment = assignments[index] as ASTAssignmentStatement;
        const current = removeContextPrefixInNamespace(
          transformASTToString(assignment.variable)
        );
        result.push(current);

        if (scope === globalScope) {
          result.push(`globals.${current}`);
        }

        if (scope === outerScope) {
          result.push(`outer.${current}`);
        }
      }
    }

    return Array.from(new Set(result));
  }

  findAllAvailableIdentifierRelatedToPosition(item: ASTBase): string[] {
    const scopes = this.lookupScopes(item);
    const result: string[] = [];
    const rootScope = scopes.shift();
    const outerScope = scopes.length > 0 ? scopes[0] : null;
    const globalScope = this.lookupGlobalScope(item);

    if (rootScope) {
      if (rootScope instanceof ASTFunctionStatement) {
        for (const parameter of rootScope.parameters) {
          if (parameter instanceof ASTAssignmentStatement) {
            const parameterName = (parameter.variable as ASTIdentifier).name;
            result.push(parameterName, `locals.${parameterName}`);
          } else if (parameter instanceof ASTIdentifier) {
            result.push(parameter.name, `locals.${parameter.name}`);
          }
        }
      }

      const assignments = [...rootScope.assignments];

      for (let index = 0; index < assignments.length; index++) {
        const assignment = assignments[index] as ASTAssignmentStatement;

        if (assignment.end!.line >= item.end!.line) break;

        const current = removeContextPrefixInNamespace(
          transformASTToString(assignment.variable)
        );
        result.push(current, `locals.${current}`);

        if (rootScope === globalScope) {
          result.push(`globals.${current}`);
        }
      }
    }

    for (const scope of scopes) {
      const assignments = [...scope.assignments];

      for (let index = 0; index < assignments.length; index++) {
        const assignment = assignments[index] as ASTAssignmentStatement;
        const current = removeContextPrefixInNamespace(
          transformASTToString(assignment.variable)
        );
        result.push(current);

        if (scope === globalScope) {
          result.push(`globals.${current}`);
        }

        if (scope === outerScope) {
          result.push(`outer.${current}`);
        }
      }
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

  lookupGlobalScope(item: ASTBase): ASTChunkAdvanced {
    let result: ASTBaseBlockWithScope = null;
    let current = item.scope;

    if (item instanceof ASTBaseBlockWithScope) {
      result = item;
    }

    while (current) {
      result = current;
      current = current.scope;
    }

    return result as ASTChunkAdvanced;
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
      previous?.type === ASTType.MemberExpression &&
      closest === (previous as ASTMemberExpression).identifier
    ) {
      return typeMap.resolvePath(previous);
    } else if (
      previous?.type === ASTType.IndexExpression &&
      closest === (previous as ASTIndexExpression).index &&
      closest.type === ASTType.StringLiteral
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
