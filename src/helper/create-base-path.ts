import path from 'path';

export const getMatchingSegments = (
  targetDir: string,
  filePath: string
): string[] => {
  const targetRootSegments = targetDir.split(path.sep);
  const pathSegments = filePath.split(path.sep);
  const matches: string[] = [];

  for (const segment of targetRootSegments) {
    const current = pathSegments.shift();

    if (current !== segment) {
      break;
    }

    matches.push(current);
  }

  return matches;
};

export const createBasePath = (
  targetDir: string,
  filePath: string,
  base: string = '.'
): string => {
  const filtered: string[] = getMatchingSegments(targetDir, filePath);

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
