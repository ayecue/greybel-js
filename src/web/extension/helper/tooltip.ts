import {
  SignatureDefinitionFunction,
  SignatureDefinitionFunctionArg,
  SignatureDefinitionTypeMeta
} from 'meta-utils';
import { IEntity } from 'miniscript-type-analyzer';

import {
  PseudoHover,
  PseudoMarkdownString,
  PseudoSignatureInformation
} from './vs.js';

export function formatTypes(types: SignatureDefinitionTypeMeta[] = []): string {
  return types.map((item) => item.toString().replace(',', '٫')).join(' or ');
}

export function formatDefaultValue(value: number | string): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return value.toString();
}

export const createTooltipHeader = (item: IEntity, definition: SignatureDefinitionFunction) => {
  const args = definition.getArguments() || [];
  const returnValues = formatTypes(definition.getReturns()) || 'null';

  if (args.length === 0) {
    return `(${item.kind}) ${item.label} (): ${returnValues}`;
  }

  const argValues = args
    .map(
      (item) =>
        `${item.getLabel()}${item.isOptional() ? '?' : ''}: ${formatTypes(item.getTypes())}${item.getDefault() ? ` = ${formatDefaultValue(item.getDefault().value)}` : ''
        }`
    )
    .join(', ');

  return `(${item.kind}) ${item.label} (${argValues}): ${returnValues}`;
};

export const appendTooltipHeader = (
  text: PseudoMarkdownString,
  item: IEntity,
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
  item: IEntity
): PseudoSignatureInformation[] => {
  const signatureInfos: PseudoSignatureInformation[] = [];

  for (const definition of item.signatureDefinitions) {
    const fnDef = definition as SignatureDefinitionFunction;
    const label = createTooltipHeader(item, fnDef);
    const args = fnDef.getArguments() ?? [];
    const text = new PseudoMarkdownString('');

    appendTooltipBody(text, fnDef);

    const parameters = args.map((argItem: SignatureDefinitionFunctionArg) => {
      return {
        label: `${argItem.getLabel()}${argItem.isOptional() ? '?' : ''}: ${argItem.getTypes().join(' or ')}`
      };
    });
    const documentation = text;

    signatureInfos.push(new PseudoSignatureInformation(
      label,
      parameters,
      documentation
    ));
  }

  return signatureInfos;
};

export const createHover = (item: IEntity): PseudoHover => {
  const texts: PseudoMarkdownString[] = [];

  for (const definition of item.signatureDefinitions) {
    const text = new PseudoMarkdownString('');
    const fnDef = definition as SignatureDefinitionFunction;

    appendTooltipHeader(text, item, fnDef);
    appendTooltipBody(text, fnDef);

    texts.push(text);
  }

  return new PseudoHover(texts);
};
