import monacoLoader from '@monaco-editor/loader';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import React, { useEffect, useState } from 'react';

import { activate } from '../../extension.js';
import language from '../../extension/grammar/language.js';
import documentParseQueue from '../../extension/helper/model-manager.js';
import { buildClassName } from '../utils.js';
import Editor from './editor';

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
  collapsed: boolean;
}

export function EditorRoot({
  initialContent,
  onError,
  onChange,
  collapsed,
  onCreate
}: EditorRootOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );

  useEffect(() => {
    monacoLoader.init().then((resolvedMonaco: typeof Monaco) => {
      resolvedMonaco.languages.register({ id: 'greyscript' });
      resolvedMonaco.languages.setMonarchTokensProvider('greyscript', language);

      activate(resolvedMonaco);

      const model = resolvedMonaco.editor.createModel(
        initialContent,
        'greyscript'
      );

      model.onDidChangeContent((_event) => {
        documentParseQueue.update(model);

        try {
          onChange?.(model.getValue());
        } catch (err: any) {
          onError?.(err);
        }
      });

      setEditorContext({
        monaco: resolvedMonaco,
        model
      });
    });
  }, []);

  if (editorContext === null) {
    return <div className="editor-root">Loading</div>;
  }

  return (
    <div className="editor-root">
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
        className={buildClassName({
          shouldAdd: collapsed,
          className: 'fullscreen'
        })}
      />
    </div>
  );
}
