import { Minifier } from 'greybel-transpiler';

export interface MinifyOptions {
  uglify?: boolean;
  maxWords?: number;
  obfuscation?: boolean;
  excludedNamespaces?: string[];
  disableLiteralsOptimization?: boolean;
  disableNamespacesOptimization?: boolean;
  envFiles?: string[];
  envVars?: string[];
}

export default function build(
  code: string,
  options: MinifyOptions = {}
): string {
  const buildOptions = {
    uglify: false,
    maxWords: 80000,
    obfuscation: true,
    excludedNamespaces: [],
    disableLiteralsOptimization: false,
    disableNamespacesOptimization: false,
    ...options
  };

  return new Minifier({
    code,
    uglify: buildOptions.uglify,
    excludedNamespaces: buildOptions.excludedNamespaces,
    disableLiteralsOptimization: buildOptions.disableLiteralsOptimization,
    disableNamespacesOptimization: buildOptions.disableNamespacesOptimization
  }).minify();
}
