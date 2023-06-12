import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import React, { useEffect, useRef } from 'react';

import { buildClassName } from '../utils.js';

export interface EditorOptions {
  model: Monaco.editor.ITextModel;
  monaco: typeof Monaco;
  onCreate: (instance: Monaco.editor.IStandaloneCodeEditor) => void;
  className?: string;
}

export default function Editor({
  monaco,
  model,
  onCreate,
  className
}: EditorOptions) {
  const editorRef = useRef(null);

  useEffect(() => {
    const instance = monaco.editor.create(editorRef.current!, {
      model,
      automaticLayout: true,
      theme: 'vs-dark'
    });

    onCreate(instance);
  }, []);

  return (
    <div
      className={buildClassName('editor-ide', {
        shouldAdd: !!className && className.length > 0,
        className: className!
      })}
      ref={editorRef}
    ></div>
  );
}
