import {
  CustomBoolean,
  CustomFunction,
  CustomList,
  CustomMap,
  CustomNil,
  CustomNumber,
  CustomString,
  ObjectValue
} from 'greybel-interpreter';
import { Theme, transform } from 'transform-json-to-html';

const parseItem = (item: any): any => {
  if (item instanceof CustomString) {
    return item.toString();
  } else if (item instanceof CustomNumber) {
    return item.toNumber();
  } else if (item instanceof CustomBoolean) {
    return item.toTruthy();
  } else if (item instanceof CustomFunction) {
    return item.toString();
  } else if (item instanceof CustomList) {
    return item.value.map(parseItem);
  } else if (item instanceof CustomMap) {
    return parseItem(item.value);
  } else if (item instanceof ObjectValue) {
    const entries: [any, any][] = item
      .entries()
      .map(([key, value]) => [parseItem(key), parseItem(value)]);
    return new Map(entries);
  } else if (item instanceof CustomNil) {
    return null;
  }

  return item;
};

export default function view(scope: any): HTMLElement {
  const output = transform(scope, {
    depth: 6,
    theme: Theme.Dark,
    parseItem
  });

  return output;
}
