import { Context, Transformer } from 'greybel-transpiler';
import DefaultMapProvider, {
  BuildMap
} from 'greybel-transpiler/dist/build-map/default.js';
import { ASTBase } from 'greyscript-core';

export default function transform(item: ASTBase): string {
  const provider = <(make: Function, context: Context) => BuildMap>(
    (<unknown>DefaultMapProvider)
  );
  const transformer = new Transformer(
    provider,
    <Context>(<unknown>{}),
    new Map()
  );
  return transformer.make(item);
}
