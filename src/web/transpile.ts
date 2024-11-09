import { BuildType } from 'greybel-transpiler';
import { greyscriptMeta } from 'greyscript-meta';
import { DirectTranspiler } from 'greyscript-transpiler';

export interface TranspileOptions {
  uglify?: boolean;
  beautify?: boolean;
  beautifyKeepParentheses?: boolean;
  beautifyIndentation?: number;
  beautifyIndentationSpaces?: number;
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
  options: TranspileOptions = {}
): string {
  const transpilerOptions = {
    uglify: false,
    beautify: false,

    maxWords: 80000,
    obfuscation: false,
    excludedNamespaces: [],
    disableLiteralsOptimization: false,
    disableNamespacesOptimization: false,
    beautifyKeepParentheses: false,
    beautifyIndentation: 0,
    beautifyIndentationSpaces: 2,
    ...options
  };
  let buildType = BuildType.DEFAULT;
  let buildOptions: any = {
    isDevMode: true
  };

  if (transpilerOptions.uglify) {
    buildType = BuildType.UGLIFY;
    buildOptions = {
      disableLiteralsOptimization:
        transpilerOptions.disableLiteralsOptimization,
      disableNamespacesOptimization:
        transpilerOptions.disableNamespacesOptimization
    };
  } else if (transpilerOptions.beautify) {
    buildType = BuildType.BEAUTIFY;
    buildOptions = {
      isDevMode: true,
      keepParentheses: transpilerOptions.beautifyKeepParentheses,
      indentation: transpilerOptions.beautifyIndentation,
      indentationSpaces: transpilerOptions.beautifyIndentationSpaces
    };
  }

  return new DirectTranspiler({
    code,
    buildType,
    buildOptions,
    obfuscation: transpilerOptions.obfuscation,
    excludedNamespaces: [
      'params',
      ...transpilerOptions.excludedNamespaces,
      ...Array.from(
        Object.keys(greyscriptMeta.getTypeSignature('general').getDefinitions())
      )
    ]
  }).parse();
}
