export const escapeMSString = (str: string): string => {
  return str.replace(/"/g, '""');
};
