import { ASTChunkAdvanced } from 'greybel-core';
import {
  ASTAssignmentStatement,
  ASTBase,
  ASTBaseBlockWithScope,
  ASTCallExpression,
  ASTCallStatement,
  ASTComment,
  ASTFunctionStatement,
  ASTIdentifier,
  ASTIndexExpression,
  ASTListConstructorExpression,
  ASTListValue,
  ASTLiteral,
  ASTMapConstructorExpression,
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
import {
  isGlobalsContextNamespace,
  isLocalsContextNamespace,
  isOuterContextNamespace,
  removeContextPrefixInNamespace,
  removeGlobalsContextPrefixInNamespace,
  removeLocalsContextPrefixInNamespace,
  removeOuterContextPrefixInNamespace
} from './utils.js';

const DEFAULT_CUSTOM_FUNCTION_DESCRIPTION =
  `This is a custom method. You can add a description for this method by adding a comment above or after the function.
\`\`\`
myFunction = function(a, b, c) // This function does xyz
\`\`\`
or
\`\`\`
/*
  This function does xyz
*/
myFunction = function(a, b, c)
\`\`\`` as const;

export enum TypeInfoKind {
  Variable = 'var',
  Function = 'function',
  Literal = 'literal',
  Constant = 'constant',
  ListConstructor = 'list',
  MapConstructor = 'map',
  Expression = 'expr',
  Unknown = 'unknown'
}

export class TypeInfo {
  kind: TypeInfoKind;
  label: string;
  type: string[];

  constructor(kind: TypeInfoKind, label: string, type: string[]) {
    this.kind = kind;
    this.label = label;
    this.type = type;
  }

  setType(type: string[]) {
    this.type = type.includes('any') ? ['any'] : type;
    return this;
  }

  extendType(type: string[]) {
    const uniqItems = Array.from(new Set([...this.type, ...type]));
    return this.setType(uniqItems);
  }

  copy() {
    return new TypeInfo(this.kind, this.label, this.type);
  }
}

export class TypeInfoWithDefinition extends TypeInfo {
  definition: SignatureDefinition;

  constructor(label: string, type: string[], definition: SignatureDefinition) {
    super(TypeInfoKind.Function, label, type);
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
    const name = removeContextPrefixInNamespace(transformASTToNamespace(item));
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
              me.resolveIdentifier(identifer) ||
              new TypeInfo(TypeInfoKind.Variable, name, ['any']);
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
          currentMetaInfo = new TypeInfo(TypeInfoKind.Variable, name, ['any']);
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
            currentMetaInfo = new TypeInfo(TypeInfoKind.Variable, key, ['any']);
            break;
          }

          // todo add better retrieval
          const indexType = me.resolve(indexValue);

          if (!indexType) {
            return null;
          }

          currentMetaInfo = new TypeInfo(
            TypeInfoKind.Variable,
            indexType.type[0],
            ['any']
          );
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
        return new TypeInfo(TypeInfoKind.Constant, name, ['list:string']);
      case 'globals':
        return new TypeInfo(TypeInfoKind.Constant, name, ['map:any']);
      case 'locals':
        return new TypeInfo(TypeInfoKind.Constant, name, ['map:any']);
      case 'outer':
        return new TypeInfo(TypeInfoKind.Constant, name, ['map:any']);
      case 'self':
        return new TypeInfo(TypeInfoKind.Constant, name, ['map:any']);
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

    return new TypeInfo(TypeInfoKind.Variable, name, ['any']);
  }

  private getLastASTItemOfLine(line: number): ASTBase {
    if (this.root.lines.has(line)) {
      const items = this.root.lines.get(line);

      if (items.length > 0) {
        return items[items.length - 1];
      }
    }

    return null;
  }

  private findASTItemInLine(line: number, type: ASTType): ASTBase {
    if (this.root.lines.has(line)) {
      const items = this.root.lines.get(line);
      const result = items.find((item) => item.type === type);

      if (result) {
        return result;
      }
    }

    return null;
  }

  private getItemDescription(
    item: ASTBase,
    defaultText: string = ''
  ): string | null {
    const me = this;
    const previousItem = me.getLastASTItemOfLine(item.start.line - 1);
    const currentItem = me.findASTItemInLine(item.start.line, ASTType.Comment);

    if (previousItem instanceof ASTComment) {
      return previousItem.value;
    } else if (currentItem instanceof ASTComment) {
      return currentItem.value;
    }

    return defaultText;
  }

  private resolveFunctionDeclaration(
    item: ASTFunctionStatement
  ): TypeInfoWithDefinition | null {
    const me = this;
    const description = me.getItemDescription(
      item,
      DEFAULT_CUSTOM_FUNCTION_DESCRIPTION
    );

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
      description
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
        return new TypeInfo(
          TypeInfoKind.Literal,
          (item as ASTLiteral).raw.toString(),
          ['null']
        );
      case ASTType.StringLiteral:
        return new TypeInfo(
          TypeInfoKind.Literal,
          (item as ASTLiteral).raw.toString(),
          ['string']
        );
      case ASTType.NumericLiteral:
        return new TypeInfo(
          TypeInfoKind.Literal,
          (item as ASTLiteral).raw.toString(),
          ['number']
        );
      case ASTType.BooleanLiteral:
        return new TypeInfo(
          TypeInfoKind.Literal,
          (item as ASTLiteral).raw.toString(),
          ['number']
        );
      case ASTType.MapConstructorExpression:
        return new TypeInfo(TypeInfoKind.MapConstructor, '{}', ['map:any']);
      case ASTType.ListConstructorExpression:
        return new TypeInfo(TypeInfoKind.ListConstructor, '[]', ['list:any']);
      case ASTType.BinaryExpression:
        return new TypeInfo(TypeInfoKind.Expression, 'Binary expression', [
          'number',
          'string',
          'list:any',
          'map:any'
        ]);
      case ASTType.LogicalExpression:
        return new TypeInfo(TypeInfoKind.Expression, 'Logical expression', [
          'number'
        ]);
      case ASTType.SliceExpression:
        return new TypeInfo(TypeInfoKind.Expression, 'Slice expression', [
          'any'
        ]);
      case ASTType.Unknown:
        return new TypeInfo(TypeInfoKind.Unknown, 'Unknown', ['any']);
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
      case ASTType.SliceExpression:
      case ASTType.Unknown:
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

    const globalIdentifierTypes = me.refs.get(me.root);
    const setReference = (name: string, item: ASTBase) => {
      const resolved = me.resolve(item);

      if (resolved === null) return;

      let typeInfo: TypeInfo;

      if (
        item instanceof ASTFunctionStatement &&
        resolved instanceof TypeInfoWithDefinition
      ) {
        typeInfo = new TypeInfoWithDefinition(
          name,
          resolved.type,
          (resolved as TypeInfoWithDefinition).definition
        );
      } else if (
        item instanceof ASTUnaryExpression &&
        item.operator === '@' &&
        resolved instanceof TypeInfoWithDefinition
      ) {
        typeInfo = new TypeInfoWithDefinition(
          name,
          resolved.type,
          (resolved as TypeInfoWithDefinition).definition
        );
      } else if (
        item instanceof ASTMapConstructorExpression &&
        resolved instanceof TypeInfo
      ) {
        for (const field of item.fields) {
          const key = `${name}.${transformASTToNamespace(field.key)}`;
          setReference(key, field.value);
        }

        typeInfo = new TypeInfo(TypeInfoKind.Variable, name, resolved.type);
      } else if (
        item instanceof ASTListConstructorExpression &&
        resolved instanceof TypeInfo
      ) {
        for (const field of item.fields) {
          const key = `${name}[number]`;
          setReference(key, field.value);
        }

        typeInfo = new TypeInfo(TypeInfoKind.Variable, name, resolved.type);
      } else {
        typeInfo =
          resolved instanceof TypeInfoWithDefinition
            ? new TypeInfo(
                TypeInfoKind.Variable,
                name,
                resolved.definition.returns || ['any']
              )
            : new TypeInfo(TypeInfoKind.Variable, name, resolved.type);
      }

      // in case globals is used variable needs to get attached to global scope
      if (isGlobalsContextNamespace(name)) {
        const nameWithoutGlobalsPrefix =
          removeGlobalsContextPrefixInNamespace(name);

        typeInfo.label = nameWithoutGlobalsPrefix;

        if (globalIdentifierTypes.has(nameWithoutGlobalsPrefix)) {
          typeInfo.extendType(globalIdentifierTypes.get(nameWithoutGlobalsPrefix)!.type);
        }

        globalIdentifierTypes.set(nameWithoutGlobalsPrefix, typeInfo);
        return;
        // in case outer is used variable needs to get attached to outer scope
      } else if (
        isOuterContextNamespace(name) &&
        item.scope?.scope != null &&
        me.refs.has(item.scope.scope)
      ) {
        const outerIdentifierTypes = me.refs.get(item.scope.scope);
        const nameWithoutOuterPrefix =
          removeOuterContextPrefixInNamespace(name);

        typeInfo.label = nameWithoutOuterPrefix;

        if (outerIdentifierTypes.has(nameWithoutOuterPrefix)) {
          typeInfo.extendType(outerIdentifierTypes.get(nameWithoutOuterPrefix)!.type);
        }

        outerIdentifierTypes.set(nameWithoutOuterPrefix, typeInfo);
        return;
        // in case locals is used variable needs to get attached to locals scope
      } else if (isLocalsContextNamespace(name)) {
        const nameWithoutLocalsPrefix =
          removeLocalsContextPrefixInNamespace(name);

        typeInfo.label = nameWithoutLocalsPrefix;

        if (identiferTypes.has(nameWithoutLocalsPrefix)) {
          typeInfo.extendType(identiferTypes.get(nameWithoutLocalsPrefix)!.type);
        }

        identiferTypes.set(nameWithoutLocalsPrefix, typeInfo);
        return;
      }

      if (identiferTypes.has(name)) {
        typeInfo.extendType(identiferTypes.get(name)!.type);
      }

      identiferTypes.set(name, typeInfo);
    };

    for (const assignment of assignments) {
      const name = transformASTToNamespace(assignment.variable);
      setReference(name, assignment.init);
    }
  }

  analyze() {
    const me = this;

    me.analyzeScope(me.root);

    for (const scope of me.root.scopes) {
      me.analyzeScope(scope);
    }
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

    console.time(`Analyzing for ${document.uri.fsPath} done within`);

    try {
      typeMap.analyze();
    } catch (err) {
      console.error(err);
    }

    console.timeEnd(`Analyzing for ${document.uri.fsPath} done within`);

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
