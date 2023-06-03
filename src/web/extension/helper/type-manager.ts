import { ASTChunkAdvanced } from 'greybel-core';
import {
  ASTAssignmentStatement,
  ASTBase,
  ASTBaseBlockWithScope,
  ASTCallExpression,
  ASTCallStatement,
  ASTFunctionStatement,
  ASTIdentifier,
  ASTIndexExpression,
  ASTListValue,
  ASTLiteral,
  ASTMemberExpression,
  ASTParenthesisExpression,
  ASTType,
  ASTUnaryExpression
} from 'greyscript-core';
import {
  getDefinition,
  getDefinitions,
  SignatureDefinition,
  SignatureDefinitionArg,
  SignatureDefinitionContainer
} from 'greyscript-meta';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';

import transformASTToNamespace from './ast-namespace.js';
import transformASTToString from './ast-stringify.js';

export class TypeInfo {
  label: string;
  type: string[];

  constructor(label: string, type: string[]) {
    this.label = label;
    this.type = type;
  }

  copy() {
    return new TypeInfo(this.label, this.type);
  }
}

export class TypeInfoWithDefinition extends TypeInfo {
  definition: SignatureDefinition;

  constructor(label: string, type: string[], definition: SignatureDefinition) {
    super(label, type);
    this.definition = definition;
  }

  copy() {
    return new TypeInfoWithDefinition(this.label, this.type, this.definition);
  }
}

export const lookupIdentifier = (root: ASTBase): ASTBase | null => {
  // non greey identifier to string method; can be used instead of ASTStringify
  switch (root.type) {
    case ASTType.CallStatement:
      return lookupIdentifier((root as ASTCallStatement).expression);
    case ASTType.CallExpression:
      return lookupIdentifier((root as ASTCallExpression).base);
    case ASTType.Identifier:
      return root;
    case ASTType.MemberExpression:
      return lookupIdentifier((root as ASTMemberExpression).identifier);
    case ASTType.IndexExpression:
      return lookupIdentifier((root as ASTIndexExpression).index);
    default:
      return null;
  }
};

export const lookupBase = (node: ASTBase | null = null): ASTBase | null => {
  switch (node?.type) {
    case ASTType.MemberExpression:
      return (node as ASTMemberExpression).base;
    case ASTType.IndexExpression:
      return (node as ASTIndexExpression).base;
    case ASTType.CallExpression:
      return (node as ASTCallExpression).base;
    default:
      return null;
  }
};

export class TypeMap {
  private root: ASTChunkAdvanced;
  private refs: WeakMap<ASTBase, Map<string, TypeInfo>>;

  constructor(root: ASTChunkAdvanced) {
    this.root = root;
    this.refs = new WeakMap();
  }

  lookupTypeOfNamespace(item: ASTBase): TypeInfo | null {
    const me = this;
    const name = transformASTToNamespace(item);
    let currentScope = item.scope;

    while (currentScope) {
      if (me.refs.has(currentScope)) {
        const typeMap = me.refs.get(currentScope)!;

        if (typeMap.has(name)) {
          const typeInfo = typeMap.get(name)!;
          return typeInfo;
        }
      }

      currentScope = currentScope.scope;
    }

    return null;
  }

  resolvePath(item: ASTBase): TypeInfo | null {
    const me = this;
    const namespaceType = me.lookupTypeOfNamespace(item);

    if (namespaceType) {
      return namespaceType;
    }

    let base: ASTBase | null = item;
    const traversalPath: ASTBase[] = [];

    // prepare traversal path
    while (base) {
      if (base.type === ASTType.CallExpression) {
        base = lookupBase(base);
        continue;
      }

      const identifer = lookupIdentifier(base);
      traversalPath.unshift(identifer || base);

      base = lookupBase(base);
    }

    // retreive type
    let origin;
    let currentMetaInfo: TypeInfo | null = null;

    while ((origin = traversalPath.shift())) {
      switch (origin.type) {
        case ASTType.Identifier: {
          const identifer = origin as ASTIdentifier;
          const name = identifer.name;

          // resolve first identifier
          if (!currentMetaInfo) {
            currentMetaInfo =
              me.resolveIdentifier(identifer) || new TypeInfo(name, ['any']);
            break;
          }

          // get signature
          let definitions: SignatureDefinitionContainer | null = null;

          if (currentMetaInfo instanceof TypeInfoWithDefinition) {
            const definition = currentMetaInfo.definition;
            definitions = getDefinitions(definition.returns);
          } else {
            definitions = getDefinitions(currentMetaInfo.type);
          }

          if (name in definitions) {
            const definition = definitions[name];
            currentMetaInfo = new TypeInfoWithDefinition(
              name,
              ['function'],
              definition
            );
            break;
          }

          // todo add retrieval for object/lists
          currentMetaInfo = new TypeInfo(name, ['any']);
          break;
        }
        case ASTType.IndexExpression: {
          if (!currentMetaInfo) {
            return null;
          }

          const indexExpr = origin as ASTIndexExpression;
          const indexValue = indexExpr.index;

          if (
            indexValue instanceof ASTLiteral &&
            indexValue.type === ASTType.StringLiteral
          ) {
            // get signature
            let definitions = null;

            if (currentMetaInfo instanceof TypeInfoWithDefinition) {
              const definition = currentMetaInfo.definition;
              definitions = getDefinitions(definition.returns);
            } else {
              definitions = getDefinitions(currentMetaInfo.type);
            }

            const key = indexValue.value.toString();

            if (key in definitions) {
              const definition = definitions[key];
              currentMetaInfo = new TypeInfoWithDefinition(
                key,
                ['function'],
                definition
              );
              break;
            }

            // todo add better retrieval
            currentMetaInfo = new TypeInfo(key, ['any']);
            break;
          }

          // todo add better retrieval
          const indexType = me.resolve(indexValue);
          currentMetaInfo = new TypeInfo(indexType.type[0], ['any']);
          break;
        }
        default: {
          if (!currentMetaInfo) {
            currentMetaInfo = me.resolveDefault(origin);
            break;
          }
          return null;
        }
      }
    }

    return currentMetaInfo;
  }

  private resolveIdentifier(item: ASTIdentifier): TypeInfo | null {
    const me = this;
    const name = item.name;

    // special behavior for global variables
    switch (name) {
      case 'params':
        return new TypeInfo(name, ['list:string']);
      case 'globals':
        return new TypeInfo(name, ['map:any']);
      case 'locals':
        return new TypeInfo(name, ['map:any']);
      case 'self':
        return new TypeInfo(name, ['map:any']);
    }

    // check for default namespace
    const defaultDef = getDefinition(['general'], name);

    if (defaultDef) {
      return new TypeInfoWithDefinition(name, ['function'], defaultDef);
    }

    // get type info from scopes
    const namespaceType = me.lookupTypeOfNamespace(item);

    if (namespaceType) {
      return namespaceType;
    }

    return new TypeInfo(name, ['any']);
  }

  private resolveFunctionDeclaration(
    item: ASTFunctionStatement
  ): TypeInfoWithDefinition | null {
    const me = this;

    return new TypeInfoWithDefinition('anonymous', ['function'], {
      arguments: item.parameters.map((arg: ASTBase) => {
        if (arg.type === ASTType.Identifier) {
          return {
            label: transformASTToString(arg),
            type: 'any'
          } as SignatureDefinitionArg;
        }

        const assignment = arg as ASTAssignmentStatement;

        return {
          label: transformASTToString(assignment.variable),
          type: me.resolve(assignment.init)?.type[0] || 'any'
        };
      }),
      returns: ['any'],
      description: 'This is a custom method.'
    });
  }

  private resolveCallStatement(item: ASTCallStatement): TypeInfo | null {
    const { expression } = item;
    return this.resolve(expression);
  }

  private resolveCallExpression(item: ASTCallExpression): TypeInfo | null {
    const { base } = item;
    return this.resolve(base);
  }

  private resolveListValue(item: ASTListValue): TypeInfo | null {
    const { value } = item;
    return this.resolve(value);
  }

  private resolveParenthesisExpression(
    item: ASTParenthesisExpression
  ): TypeInfo | null {
    const { expression } = item;
    return this.resolve(expression);
  }

  private resolveUnaryExpression(item: ASTUnaryExpression): TypeInfo | null {
    const { operator, argument } = item;

    if (operator !== '@') {
      return null;
    }

    return this.resolve(argument);
  }

  private resolveDefault(item: ASTBase): TypeInfo | null {
    switch (item.type) {
      case ASTType.NilLiteral:
        return new TypeInfo((item as ASTLiteral).raw.toString(), ['null']);
      case ASTType.StringLiteral:
        return new TypeInfo((item as ASTLiteral).raw.toString(), ['string']);
      case ASTType.NumericLiteral:
        return new TypeInfo((item as ASTLiteral).raw.toString(), ['number']);
      case ASTType.BooleanLiteral:
        return new TypeInfo((item as ASTLiteral).raw.toString(), ['number']);
      case ASTType.MapConstructorExpression:
        return new TypeInfo('{}', ['map:any']);
      case ASTType.ListConstructorExpression:
        return new TypeInfo('[]', ['list:any']);
      case ASTType.BinaryExpression:
        return new TypeInfo('Binary expression', [
          'number',
          'string',
          'list:any',
          'map:any'
        ]);
      case ASTType.LogicalExpression:
        return new TypeInfo('Logical expression', ['number']);
      default:
        return null;
    }
  }

  resolve(item: ASTBase): TypeInfo | null {
    if (item == null) return null;

    const me = this;

    switch (item.type) {
      case ASTType.Identifier:
        return me.resolveIdentifier(item as ASTIdentifier);
      case ASTType.MemberExpression:
      case ASTType.IndexExpression:
        return me.resolvePath(item);
      case ASTType.FunctionDeclaration:
        return me.resolveFunctionDeclaration(item as ASTFunctionStatement);
      case ASTType.CallStatement:
        return me.resolveCallStatement(item as ASTCallStatement);
      case ASTType.CallExpression:
        return me.resolveCallExpression(item as ASTCallExpression);
      case ASTType.UnaryExpression:
        return me.resolveUnaryExpression(item as ASTUnaryExpression);
      case ASTType.ParenthesisExpression:
        return me.resolveParenthesisExpression(
          item as ASTParenthesisExpression
        );
      case ASTType.ListValue:
        return me.resolveListValue(item as ASTListValue);
      case ASTType.NilLiteral:
      case ASTType.StringLiteral:
      case ASTType.NumericLiteral:
      case ASTType.BooleanLiteral:
      case ASTType.MapConstructorExpression:
      case ASTType.ListConstructorExpression:
      case ASTType.BinaryExpression:
      case ASTType.LogicalExpression:
        return me.resolveDefault(item);
      default:
        return null;
    }
  }

  private analyzeScope(scope: ASTBaseBlockWithScope) {
    const me = this;
    const identiferTypes: Map<string, TypeInfo> = new Map();
    const assignments = scope.assignments as ASTAssignmentStatement[];

    me.refs.set(scope, identiferTypes);

    for (const assignment of assignments) {
      const name = transformASTToNamespace(assignment.variable);
      const resolved = me.resolve(assignment.init);

      if (resolved === null) continue;

      let typeInfo;

      if (
        assignment.init instanceof ASTFunctionStatement &&
        resolved instanceof TypeInfoWithDefinition
      ) {
        typeInfo = new TypeInfoWithDefinition(
          name,
          resolved.type,
          (resolved as TypeInfoWithDefinition).definition
        );
      } else if (
        assignment.init instanceof ASTUnaryExpression &&
        assignment.init.operator === '@' &&
        resolved instanceof TypeInfoWithDefinition
      ) {
        typeInfo = new TypeInfoWithDefinition(
          name,
          resolved.type,
          (resolved as TypeInfoWithDefinition).definition
        );
      } else {
        typeInfo =
          resolved instanceof TypeInfoWithDefinition
            ? new TypeInfo(name, resolved.definition.returns || ['any'])
            : new TypeInfo(name, resolved.type);
      }

      if (identiferTypes.has(name)) {
        typeInfo.type = Array.from(
          new Set([...typeInfo.type, ...identiferTypes.get(name)!.type])
        );
      }

      identiferTypes.set(name, typeInfo);
    }
  }

  analyze() {
    const me = this;

    console.time('analyzing');
    me.analyzeScope(me.root);

    for (const scope of me.root.scopes) {
      me.analyzeScope(scope);
    }

    console.timeEnd('analyzing');
  }

  getIdentifierInScope(item: ASTBase): Map<string, TypeInfo> | null {
    const me = this;

    if (me.refs.has(item)) {
      return me.refs.get(item)!;
    }

    return null;
  }
}

export class TypeManager {
  private types: Map<string, TypeMap>;

  constructor() {
    this.types = new Map();
  }

  analyze(document: editor.ITextModel, chunk: ASTChunkAdvanced): TypeMap {
    const typeMap = new TypeMap(chunk);

    typeMap.analyze();

    const key = document.uri.path;
    this.types.set(key, typeMap);

    return typeMap;
  }

  get(document: editor.ITextModel): TypeMap | null {
    const key = document.uri.path;

    if (this.types.has(key)) {
      const typeMap = this.types.get(key)!;
      return typeMap;
    }

    return null;
  }
}

export default new TypeManager();
