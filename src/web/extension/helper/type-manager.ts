import { greyscriptMeta } from 'greyscript-meta';
import {
  ASTBase,
  ASTCallExpression,
  ASTCallStatement,
  ASTIndexExpression,
  ASTMemberExpression,
  ASTSliceExpression,
  ASTType
} from 'miniscript-core';
import { TypeManager } from 'miniscript-type-analyzer';

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

export default new TypeManager({
  container: greyscriptMeta
});
