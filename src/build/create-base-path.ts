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

  if (path.win32.sep === path.sep) {
    return filePath
      .replace(`${path.win32.join(...filtered)}`, base)
      .split(path.win32.sep)
      .join(path.posix.sep);
  }

  return filePath.replace(
    `${path.posix.sep}${path.posix.join(...filtered)}`,
    base
  );
};
