import { AnotherAnsiProvider, ModifierType } from 'another-ansi';
import { createRequire } from 'node:module';
import { Tag, TagRecordOpen } from 'text-mesh-transformer';

// revisit once import type { 'json' } is supported by lts
const require = createRequire(import.meta.url);
const cssColorNames = require('css-color-names/css-color-names.json');

export const ansiProvider = new AnotherAnsiProvider();
const hasOwnProperty = Object.prototype.hasOwnProperty;

export function useColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansiProvider.colorWithHex(color, content);
}

export function useBgColor(color: string | undefined, content: string): string {
  if (!color) return content;

  const cssColorMap = cssColorNames as { [key: string]: string };

  if (hasOwnProperty.call(cssColorMap, color)) {
    const item = cssColorMap[color];
    color = item;
  }

  return ansiProvider.bgColorWithHex(color, content);
}

export function wrapWithTag(openTag: TagRecordOpen, content: string): string {
  switch (openTag.type) {
    case Tag.Color:
      return useColor(openTag.attributes.value, content);
    case Tag.Underline:
      return ansiProvider.modify(ModifierType.Underline, content);
    case Tag.Italic:
      return ansiProvider.modify(ModifierType.Italic, content);
    case Tag.Bold:
      return ansiProvider.modify(ModifierType.Bold, content);
    case Tag.Strikethrough:
      return ansiProvider.modify(ModifierType.Strikethrough, content);
    case Tag.Mark:
      return useBgColor(openTag.attributes.value, content);
    case Tag.Lowercase:
      return content.toLowerCase();
    case Tag.Uppercase:
      return content.toLowerCase();
  }

  if (openTag.attributes.value) {
    return `<${openTag.type}=${openTag.attributes.value}>${content}</${openTag.type}>`;
  }

  return `<${openTag.type}>${content}</${openTag.type}>`;
}