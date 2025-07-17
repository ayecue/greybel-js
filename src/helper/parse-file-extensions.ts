export const parseFileExtensions = (fileExtensions: string[] | null) => {
  if (fileExtensions == null) {
    return null;
  }

  const result = fileExtensions
    .map((ext) => ext.trim())
    .filter((ext) => ext !== '');

  if (result.length === 0) {
    return null;
  }

  return result;
};
