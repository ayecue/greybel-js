import {
  CompletionItemKind,
  IClassType,
  IMapType,
  IResolveNamespaceResult,
  isClassType,
  isFunctionType,
  isMapType,
  isUnionType,
  isUnknownType,
  IType,
  IUnknownType,
  NIL_TYPE_ID,
  UNKNOWN_TYPE_ID
} from 'greybel-type-analyzer';
import {
  SignatureDefinitionBaseType,
  SignatureDefinitionFunction,
  SignatureDefinitionFunctionArg,
  SignatureDefinitionTypeMeta
} from 'meta-utils';

import {
  PseudoHover,
  PseudoMarkdownString,
  PseudoSignatureInformation
} from './vs.js';

const CompletionItemKindMapping: Record<CompletionItemKind, string> = {
  [CompletionItemKind.Constant]: 'constant',
  [CompletionItemKind.Expression]: 'expr',
  [CompletionItemKind.Function]: 'function',
  [CompletionItemKind.Internal]: 'internal',
  [CompletionItemKind.InternalFunction]: 'function',
  [CompletionItemKind.InternalProperty]: 'var',
  [CompletionItemKind.ListConstructor]: 'list',
  [CompletionItemKind.Literal]: 'literal',
  [CompletionItemKind.MapConstructor]: 'map',
  [CompletionItemKind.Property]: 'var',
  [CompletionItemKind.Unknown]: 'unknown',
  [CompletionItemKind.Variable]: 'var'
};

export function formatKind(kind: CompletionItemKind): string {
  return CompletionItemKindMapping[kind] || 'unknown';
}

const TYPE_CUSTOM_SORT_PRIORITY = {
  [SignatureDefinitionBaseType.Any]: 1000,
  [UNKNOWN_TYPE_ID]: 1001,
  [NIL_TYPE_ID]: 1002
};

export function sortTypes(types: string[]): string[] {
  return types.sort((a, b) => {
    const aPriority = TYPE_CUSTOM_SORT_PRIORITY[a] || 0;
    const bPriority = TYPE_CUSTOM_SORT_PRIORITY[b] || 0;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return a.localeCompare(b);
  });
}

export function formatTypes(types: SignatureDefinitionTypeMeta[] = []): string {
  return sortTypes(types.map((item) => item.toString().replace(',', '٫'))).join(
    ' or '
  );
}

export function formatDefaultValue(value: number | string): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return value.toString();
}

export const createTooltipHeader = (
  item: IResolveNamespaceResult,
  definition: SignatureDefinitionFunction
) => {
  const args = definition.getArguments() || [];
  const returnValues = formatTypes(definition.getReturns()) || 'null';

  if (args.length === 0) {
    return `(${formatKind(item.completionItemKind)}) ${
      item.path
    } (): ${returnValues}`;
  }

  const argValues = args
    .map(
      (item) =>
        `${item.getLabel()}${item.isOptional() ? '?' : ''}: ${formatTypes(
          item.getTypes()
        )}${
          item.getDefault()
            ? ` = ${formatDefaultValue(item.getDefault().value)}`
            : ''
        }`
    )
    .join(', ');

  return `(${formatKind(item.completionItemKind)}) ${
    item.path
  } (${argValues}): ${returnValues}`;
};

export const appendTooltipHeader = (
  text: PseudoMarkdownString,
  item: IResolveNamespaceResult,
  definition: SignatureDefinitionFunction
) => {
  text.appendCodeblock(createTooltipHeader(item, definition));
  text.appendMarkdown('***\n');
};

export const appendTooltipBody = (
  text: PseudoMarkdownString,
  definition: SignatureDefinitionFunction
) => {
  const example = definition.getExample() || [];

  text.appendMarkdown(definition.getDescription() + '\n');

  if (example.length > 0) {
    text.appendMarkdown('#### Examples:\n');
    text.appendCodeblock(example.join('\n'));
  }
};

export const createSignatureInfo = (
  entity: IResolveNamespaceResult
): PseudoSignatureInformation[] => {
  if (!isFunctionType(entity.item) && !isUnionType(entity.item)) return null;

  const items = isFunctionType(entity.item)
    ? [entity.item]
    : entity.item.variants.filter(isFunctionType);

  const signatureInfos: PseudoSignatureInformation[] = [];

  for (const item of items) {
    const fnDef = item.signature as SignatureDefinitionFunction;
    const label = createTooltipHeader(entity, fnDef);
    const args = fnDef.getArguments() ?? [];
    const text = new PseudoMarkdownString('');

    appendTooltipBody(text, fnDef);

    const parameters = args.map((argItem: SignatureDefinitionFunctionArg) => {
      return {
        label: `${argItem.getLabel()}${
          argItem.isOptional() ? '?' : ''
        }: ${argItem.getTypes().join(' or ')}`
      };
    });
    const documentation = text.toString();

    signatureInfos.push(
      new PseudoSignatureInformation(label, parameters, documentation)
    );
  }

  return signatureInfos;
};

export const createHover = (entity: IResolveNamespaceResult): PseudoHover => {
  if (!isFunctionType(entity.item) && !isUnionType(entity.item)) return null;

  const items = isFunctionType(entity.item)
    ? [entity.item]
    : entity.item.variants.filter(isFunctionType);
  const texts: PseudoMarkdownString[] = [];

  for (const item of items) {
    const text = new PseudoMarkdownString('');
    const fnDef = item.signature as SignatureDefinitionFunction;

    appendTooltipHeader(text, entity, fnDef);
    appendTooltipBody(text, fnDef);

    texts.push(text);
  }

  return new PseudoHover(texts);
};

export const createTypeBody = (item: IType): Record<string, string> | null => {
  const queue: Array<IMapType | IUnknownType | IClassType> = [];

  if (isMapType(item) || isUnknownType(item) || isClassType(item)) {
    queue.push(item);
  } else if (isUnionType(item)) {
    queue.push(
      ...item.variants.filter(
        (it): it is IMapType | IUnknownType | IClassType =>
          isMapType(it) || isUnknownType(it) || isClassType(it)
      )
    );
  }

  const records: Map<string, string> = new Map();

  for (const entity of queue) {
    if (entity.properties == null) continue;
    for (const [key, item] of entity.properties) {
      if (typeof key !== 'string') continue;
      const metaTypes = item.type
        .toMeta()
        .map(SignatureDefinitionTypeMeta.parse);
      records.set(key, formatTypes(metaTypes));
    }
  }

  if (records.size === 0) {
    return null;
  }

  const sortedEntries = Array.from(records.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return Object.fromEntries(sortedEntries);
};
