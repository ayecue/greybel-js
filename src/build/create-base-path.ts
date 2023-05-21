import path from 'path';

export const createBasePath = (
  target: string,
  filePath: string,
  base: string = '.'
): string => {
  const targetRootSegments = path.dirname(target).split(path.sep);
  const pathSegments = filePath.split(path.sep);
  const filtered: string[] = [];

  for (const segment of targetRootSegments) {
    const current = pathSegments.shift();

    if (current !== segment) {
      break;
    }

    filtered.push(current);
  }

  let relativePath = filePath.replace(`${path.join(...filtered)}`, base);

  if (relativePath.startsWith(path.sep)) {
    relativePath = relativePath.slice(1);
  }

  return relativePath;
};
