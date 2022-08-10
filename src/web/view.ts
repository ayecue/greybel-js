import { Interpreter } from 'greybel-interpreter';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';

import execute from './execute';
import { activate } from './extension';
import language from './extension/grammar/language';
import { createDocumentAST } from './extension/helper/model-manager';
import minify from './minify';
import { Stdin, Stdout } from './std';

export interface EditorTranspilerOptions {
  transpileEl: HTMLElement;
  outputEl: HTMLElement;

  uglifyEl: HTMLElement;
  obfuscationEl: HTMLElement;
  disableLiteralsOptimizationEl: HTMLElement;
  disableNamespaceOptimizationEl: HTMLElement;
  excludeNamespacesEl: HTMLElement;
}

export interface EditorRunnerOptions {
  paramsEl: HTMLInputElement;
  executeEl: HTMLElement;
  stopEl: HTMLElement;
  pauseEl: HTMLElement;
  stdoutEl: HTMLElement;
  stdinEl: HTMLElement;
}

export interface EditorOptions {
  monaco: typeof Monaco;
  containerEl: HTMLElement;
  errorContainerEl: HTMLElement;

  transpiler: EditorTranspilerOptions;
  runner: EditorRunnerOptions;
}

export function initTranspiler(
  model: Monaco.editor.IModel,
  showError: Function,
  options: EditorTranspilerOptions
) {
  const {
    transpileEl,
    outputEl,
    uglifyEl,
    obfuscationEl,
    disableLiteralsOptimizationEl,
    disableNamespaceOptimizationEl,
    excludeNamespacesEl
  } = options;

  transpileEl.addEventListener('click', async () => {
    try {
      const output = await minify(model.getValue(), {
        // @ts-ignore: Claims value is not defined
        uglify: !!uglifyEl?.checked,
        // @ts-ignore: Claims value is not defined
        obfuscation: !!obfuscationEl?.checked,
        // @ts-ignore: Claims value is not defined
        disableLiteralsOptimization: !!disableLiteralsOptimizationEl?.checked,
        disableNamespacesOptimization:
          // @ts-ignore: Claims value is not defined
          !!disableNamespaceOptimizationEl?.checked,
        // @ts-ignore: Claims value is not defined
        excludedNamespaces: excludeNamespacesEl?.value
          ?.split(',')
          .map(function (v: any) {
            return v.trim();
          })
      });

      // @ts-ignore: Claims value is not defined
      outputEl.value = output;
    } catch (err: any) {
      showError(err.message);
    }
  });
}

export function initRunner(
  model: Monaco.editor.IModel,
  showError: Function,
  options: EditorRunnerOptions
) {
  const { paramsEl, executeEl, stopEl, pauseEl, stdoutEl, stdinEl } = options;

  const stdout = new Stdout(stdoutEl);
  const stdin = new Stdin(stdinEl);

  stdoutEl.addEventListener('click', () => {
    stdinEl.focus();
  });

  executeEl.addEventListener('click', (): Promise<void> => {
    if (executeEl.classList.contains('disabled')) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let currentInterpreter: Interpreter | null = null;
      const start = () => {
        executeEl.classList.add('disabled');
        stopEl.classList.remove('disabled');
        pauseEl.classList.remove('disabled');

        stopEl.addEventListener('click', stop);
        pauseEl.addEventListener('click', pause);
      };
      const pause = () => {
        currentInterpreter?.debugger.setBreakpoint(true);
      };
      const stop = () => {
        currentInterpreter?.exit();
        finalize();
      };
      const finalize = () => {
        executeEl?.classList.remove('disabled');
        stopEl?.classList.add('disabled');
        pauseEl?.classList.add('disabled');

        stopEl?.removeEventListener('click', stop);
        pauseEl?.removeEventListener('click', pause);
      };

      execute(model.getValue(), {
        stdin,
        stdout,
        params: paramsEl.value.split(' ').filter((v) => v !== ''),
        onStart: (interpreter: Interpreter) => {
          currentInterpreter = interpreter;
          start();
        },
        onEnd: (_interpreter: Interpreter) => {
          finalize();
          resolve();
        },
        onError: (err: any) => {
          showError(err.message);
          finalize();
          resolve();
        }
      })
        .then(resolve, reject)
        .catch(reject);
    });
  });
}

export default async function init(options: EditorOptions) {
  const { monaco, containerEl, errorContainerEl } = options;

  monaco.languages.register({ id: 'greyscript' });
  monaco.languages.setMonarchTokensProvider('greyscript', language);

  activate(monaco);

  const editorModel = monaco.editor.createModel(
    localStorage.getItem('ide-content') || 'print("Hello world")',
    'greyscript'
  );

  monaco.editor.create(containerEl, {
    model: editorModel,
    automaticLayout: true,
    theme: 'vs-dark'
  });

  editorModel.onDidChangeContent((_event) => {
    createDocumentAST(editorModel);
    localStorage.setItem('ide-content', editorModel.getValue());
  });

  const showError = function (msg: string, timeout: number = 10000) {
    const errorEl = document.createElement('div');

    errorEl.innerHTML = msg;
    errorContainerEl.appendChild(errorEl);

    const timer = setTimeout(
      () => errorContainerEl.removeChild(errorEl),
      timeout
    );
    errorEl.addEventListener('click', () => {
      clearTimeout(timer);
      errorContainerEl.removeChild(errorEl);
    });
  };

  initTranspiler(editorModel, showError, options.transpiler);
  initRunner(editorModel, showError, options.runner);
}
