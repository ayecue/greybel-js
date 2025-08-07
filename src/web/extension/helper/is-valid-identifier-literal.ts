import { ASTBase, ASTLiteral, ASTType } from 'miniscript-core';

export const isValidIdentifierLiteral = (item: ASTBase): item is ASTLiteral => {
  if (item.type !== ASTType.StringLiteral) return false;
  const identifier = (item as ASTLiteral).value.toString();
  return /^[_a-z][_a-z0-9]*$/i.test(identifier);
};
