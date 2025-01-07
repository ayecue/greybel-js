const RANDOM_STRING_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' as const;

export const randomString = (size: number = 10) => {
  let id = '';
  let i = size;
  while (i--) {
    id +=
      RANDOM_STRING_ALPHABET[
        (Math.random() * RANDOM_STRING_ALPHABET.length) | 0
      ];
  }
  return id;
};
