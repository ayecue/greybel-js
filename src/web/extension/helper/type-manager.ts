import { EntityInfo, IDocument, ITypeStorage, ListType, MapType, persistTypeInNativeFunction, Type, TypeKind, TypeManager } from 'greybel-type-analyzer';
import { greyscriptMeta } from 'greyscript-meta';
import { SignatureDefinitionBaseType } from 'meta-utils';
import {
  ASTBase,
  ASTCallExpression,
  ASTCallStatement,
  ASTIndexExpression,
  ASTMemberExpression,
  ASTSliceExpression,
  ASTType
} from 'miniscript-core';

export const lookupIdentifier = (root: ASTBase): ASTBase | null => {
  // non greedy identifier to string method; can be used instead of ASTStringify
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
    case ASTType.SliceExpression:
      return (node as ASTSliceExpression).base;
    default:
      return null;
  }
};

function injectParams(document: IDocument): void {
  if (document.globals.hasProperty('params')) {
    return;
  }

  document.globals.setProperty(
    'params',
    new ListType(
      document.typeStorage.generateId(TypeKind.ListType),
      Type.createBaseType(
        SignatureDefinitionBaseType.String,
        document.typeStorage,
        document,
        document.globals
      ),
      document.typeStorage,
      document,
      document.globals
    )
  );
}

function injectGetCustomObject(
  document: IDocument,
  globalTypeStorage: ITypeStorage
): void {
  const generalInterface = document.typeStorage.getTypeById(
    SignatureDefinitionBaseType.General
  );

  if (generalInterface.hasProperty('get_custom_object')) {
    return;
  }

  const gcoMap = MapType.createDefault(
    document.typeStorage,
    document,
    document.globals
  );
  const proxyGCOFn = persistTypeInNativeFunction(
    SignatureDefinitionBaseType.General,
    'get_custom_object',
    gcoMap,
    document,
    globalTypeStorage
  );

  generalInterface.setProperty(
    'get_custom_object',
    new EntityInfo('get_custom_object', proxyGCOFn)
  );
  document.typeStorage.memory.set('$$get_custom_object', gcoMap);
}

export default new TypeManager({
  container: greyscriptMeta,
  modifyTypeStorage: (document: IDocument, globalTypeStorage: ITypeStorage) => {
    injectParams(document);
    injectGetCustomObject(document, globalTypeStorage);
  }
});
