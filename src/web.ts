import monacoLoader from '@monaco-editor/loader';

import init from './web/view';

(async () => {
  // load monaco
  const monaco = await monacoLoader.init();

  // get all elements
  const containerEl = document.getElementById('container')!;
  const errorContainerEl = document.getElementById('editor-errors')!;
  const transpileEl = document.getElementById('transpile')!;
  const outputEl = document.getElementById('toutput')!;
  const uglifyEl = document.getElementById('uglify')!;
  const obfuscationEl = document.getElementById('obfuscation')!;
  const disableLiteralsOptimizationEl = document.getElementById(
    'disableLiteralsOptimization'
  )!;
  const disableNamespaceOptimizationEl = document.getElementById(
    'disableNamespacesOptimization'
  )!;
  const excludeNamespacesEl = document.getElementById('excludedNamespaces')!;
  const paramsEl = document.getElementById('params')! as HTMLInputElement;
  const executeEl = document.getElementById('execute')!;
  const stopEl = document.getElementById('stop')!;
  const pauseEl = document.getElementById('pause')!;
  const stdoutEl = document.getElementById('stdout')!;
  const stdinEl = document.getElementById('stdin')!;

  const urlSearchParams = new URLSearchParams(location.search);
  const gistId = urlSearchParams.get('gist') || undefined;

  // initialize editor + actions
  init({
    monaco,
    containerEl,
    errorContainerEl,
    gistId,
    transpiler: {
      transpileEl,
      outputEl,
      uglifyEl,
      obfuscationEl,
      disableLiteralsOptimizationEl,
      disableNamespaceOptimizationEl,
      excludeNamespacesEl
    },
    runner: {
      paramsEl,
      executeEl,
      stdinEl,
      stdoutEl,
      stopEl,
      pauseEl
    }
  });
})();
