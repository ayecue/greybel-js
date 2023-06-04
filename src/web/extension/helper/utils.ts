export const CONTEXT_PREFIX_PATTERN = /^(globals|locals|outer)\./;
export const removeContextPrefixInNamespace = (namespace: string): string =>
  namespace.replace(CONTEXT_PREFIX_PATTERN, '');

export const GLOBALS_CONTEXT_PREFIX_PATTERN = /^globals\./;
export const GLOBALS_CONTEXT_START = 'globals.' as const;
export const isGlobalsContextNamespace = (namespace: string): boolean =>
  namespace.startsWith(GLOBALS_CONTEXT_START);
export const removeGlobalsContextPrefixInNamespace = (
  namespace: string
): string => namespace.replace(GLOBALS_CONTEXT_PREFIX_PATTERN, '');

export const LOCALS_CONTEXT_PREFIX_PATTERN = /^locals\./;
export const LOCALS_CONTEXT_START = 'locals.' as const;
export const isLocalsContextNamespace = (namespace: string): boolean =>
  namespace.startsWith(LOCALS_CONTEXT_START);
export const removeLocalsContextPrefixInNamespace = (
  namespace: string
): string => namespace.replace(LOCALS_CONTEXT_PREFIX_PATTERN, '');

export const OUTER_CONTEXT_PREFIX_PATTERN = /^outer\./;
export const OUTER_CONTEXT_START = 'outer.' as const;
export const isOuterContextNamespace = (namespace: string): boolean =>
  namespace.startsWith(OUTER_CONTEXT_START);
export const removeOuterContextPrefixInNamespace = (
  namespace: string
): string => namespace.replace(OUTER_CONTEXT_PREFIX_PATTERN, '');
