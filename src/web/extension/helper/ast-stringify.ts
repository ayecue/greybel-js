import { Context, getFactory, Transformer } from 'greybel-transpiler';
import { ASTBase } from 'greyscript-core';

export default function transform(item: ASTBase): string {
  const transformer = new Transformer(
    getFactory(),
    <Context>(<unknown>{}),
    new Map()
  );
  return transformer.make(item);
}
