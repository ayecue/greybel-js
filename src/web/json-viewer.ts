import {
  CustomBoolean,
  CustomFunction,
  CustomInterface,
  CustomList,
  CustomMap,
  CustomNil,
  CustomNumber,
  CustomString
} from 'greybel-interpreter';
import { Theme, transform } from 'transform-json-to-html';

export default function view(scope: any): HTMLElement {
  const output = transform(scope, {
    depth: 6,
    theme: Theme.Dark,
    parseItem: (item: any): any => {
      if (item instanceof CustomString) {
        return item.toString();
      } else if (item instanceof CustomNumber) {
        return item.toNumber();
      } else if (item instanceof CustomBoolean) {
        return item.toTruthy();
      } else if (item instanceof CustomFunction) {
        return item.toString();
      } else if (item instanceof CustomList) {
        return item.value;
      } else if (item instanceof CustomMap) {
        return item.value;
      } else if (item instanceof CustomNil) {
        return null;
      } else if (item instanceof CustomInterface) {
        return item.getCustomType();
      }

      return item;
    }
  });

  return output;
}
