function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function guid() {
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export type ClassNameSegment =
  | string
  | {
      shouldAdd: boolean;
      className: string;
    };

export function buildClassName(
  ...classNameSegments: ClassNameSegment[]
): string {
  const newClassName: string[] = [];

  for (const classNameSegment of classNameSegments) {
    if (typeof classNameSegment === 'string') {
      newClassName.push(classNameSegment);
    } else if (classNameSegment instanceof Object) {
      if (classNameSegment.shouldAdd)
        newClassName.push(classNameSegment.className);
    } else {
      throw new Error('Unknown class name segment.');
    }
  }

  return newClassName.join(' ');
}

export function setQueryStringParameter(name: string, value: string) {
  const params = new URLSearchParams(location.search);
  params.set(name, value);
  window.history.replaceState(
    {},
    '',
    decodeURIComponent(`${location.pathname}?${params}`)
  );
}
