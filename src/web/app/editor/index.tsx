import monacoLoader from '@monaco-editor/loader';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { LanguageProvider, ThemeProvider } from 'monaco-textmate-provider';
import React, { useEffect, useState } from 'react';

import { activate } from '../../extension.js';
import documentParseQueue from '../../extension/helper/model-manager.js';
import { buildClassName } from '../utils.js';
import Editor from './editor.js';

export interface EditorContext {
  instance?: Monaco.editor.IStandaloneCodeEditor;
  model: Monaco.editor.ITextModel;
  monaco: typeof Monaco;
}

export interface EditorRootOptions {
  initialContent?: string;
  onError?: (err: any) => void;
  onChange?: (content: string) => void;
  onCreate?: (context: EditorContext) => void;
}

export function EditorRoot({
  initialContent,
  onError,
  onChange,
  onCreate
}: EditorRootOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );

  const onLoad = async (resolvedMonaco: typeof Monaco) => {
    resolvedMonaco.languages.register({ id: 'greyscript' });

    const languageProvider = new LanguageProvider({
      monaco: resolvedMonaco,
      wasm: new URL(process.env.TM_WASM),
      grammarSourceMap: {
        greyscript: {
          scopeName: 'source.src',
          tmLanguageFile: new URL(process.env.TM_LANGUAGE),
          languageConfigurationFile: new URL(process.env.TM_LANGUAGE_CONFIG),
        },
      },
    });
    
    const themeProvider = new ThemeProvider({
      monaco: resolvedMonaco,
      registry: await languageProvider.getRegistry(),
      themeSources: {
        default: new URL(process.env.TM_THEME),
      }
    });

    activate(resolvedMonaco);

    const model = resolvedMonaco.editor.createModel(
      initialContent,
      'greyscript'
    );

    themeProvider.setTheme('default');

    model.onDidChangeContent((_event) => {
      documentParseQueue.update(model);

      try {
        onChange?.(model.getValue());
      } catch (err: any) {
        onError?.(err);
      }
    });

    documentParseQueue.update(model);

    setEditorContext({
      monaco: resolvedMonaco,
      model
    });
  };

  useEffect(() => {
    monacoLoader.init().then((M) => onLoad(M));
  }, []);

  if (editorContext === null) {
    return <div className="editor-root">Loading</div>;
  }

  return (
    <div
      className={buildClassName('editor-root')}
    >
      <Editor
        model={editorContext.model}
        monaco={editorContext.monaco}
        onCreate={(instance) => {
          const newContext = {
            ...editorContext,
            instance
          };

          setEditorContext(newContext);
          onCreate?.(newContext);
        }}
      />
    </div>
  );
}
