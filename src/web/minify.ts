import { BuildType } from 'greybel-transpiler';
import { greyscriptMeta } from 'greyscript-meta';
import { DirectTranspiler } from 'greyscript-transpiler';

export interface MinifyOptions {
  uglify?: boolean;
  beautify?: boolean;
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
    beautify: false,

    maxWords: 80000,
    obfuscation: false,
    excludedNamespaces: [],
    disableLiteralsOptimization: false,
    disableNamespacesOptimization: false,
    ...options
  };
  let buildType = BuildType.DEFAULT;

  if (buildOptions.uglify) {
    buildType = BuildType.UGLIFY;
  } else if (buildOptions.beautify) {
    buildType = BuildType.BEAUTIFY;
  }

  return new DirectTranspiler({
    code,
    buildType,
    obfuscation: buildOptions.obfuscation,
    excludedNamespaces: [
      'params',
      ...buildOptions.excludedNamespaces,
      ...Array.from(Object.keys(greyscriptMeta.getSignaturesByType('general')))
    ],
    disableLiteralsOptimization: buildOptions.disableLiteralsOptimization,
    disableNamespacesOptimization: buildOptions.disableNamespacesOptimization
  }).parse();
}
