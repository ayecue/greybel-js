import monacoLoader from '@monaco-editor/loader';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useState } from 'react';

import { activate } from './extension';
import language from './extension/grammar/language';
import documentParseQueue from './extension/helper/model-manager';
import EditorPopups, { DebugPopup } from './app/popups';
import ErrorList, { ErrorEntry } from './app/error-list';
import { buildClassName, guid } from './app/utils';
import Editor from './app/editor';
import Transpile from './app/transpile';
import Execute from './app/execute';
import ExternalLinks, { AppExternalLink } from './app/external-links';

interface EditorContext {
  instance?: Monaco.editor.IStandaloneCodeEditor;
  model: Monaco.editor.ITextModel;
  monaco: typeof Monaco;
}

export interface AppOptions {
  initContent?: string;
  externalLinks: AppExternalLink[];
}

const activeErrors: ErrorEntry[] = [];

export default function (options: AppOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[]>([]);
  const [share, setShare] = useState<boolean>(false);
  const [debug, setDebug] = useState<DebugPopup | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    monacoLoader.init().then((resolvedMonaco: typeof Monaco) => {
      resolvedMonaco.languages.register({ id: 'greyscript' });
      resolvedMonaco.languages.setMonarchTokensProvider('greyscript', language);

      activate(resolvedMonaco);

      const content =
        options.initContent ||
        localStorage.getItem('ide-content') ||
        'print("Hello world")';
      const model = resolvedMonaco.editor.createModel(content, 'greyscript');

      model.onDidChangeContent((_event) => {
        documentParseQueue.update(model);

        try {
          localStorage.setItem('ide-content', model.getValue());
        } catch (err: any) {
          showError(err.message);
        }
      });

      setEditorContext({
        monaco: resolvedMonaco,
        model
      });
    });
  }, []);

  const removeError = (id: string) => {
    const index = activeErrors.findIndex((entry) => id === entry.id);

    if (index !== -1) {
      activeErrors.splice(index, 1);
      setErrorEntries([...activeErrors]);
    }
  };

  const showError = (msg: string, timeout: number = 10000) => {
    const id = guid();
    const remove = () => {
      clearTimeout(timer);
      removeError(id);
    };

    activeErrors.push({
      id,
      msg,
      onClick: remove
    });

    setErrorEntries([...activeErrors]);
    const timer = setTimeout(remove, timeout);
  };

  if (editorContext === null) {
    return <div>Loading</div>;
  }

  return (
    <article>
      <div className="editor-control">
        <ErrorList errors={errorEntries} />
        <EditorPopups
          share={{
            active: share,
            content: editorContext.model.getValue(),
            onClose: () => setShare(false)
          }}
          debug={debug}
        />
        <Editor
          model={editorContext.model}
          monaco={editorContext.monaco}
          onCreate={(instance) => {
            setEditorContext({
              ...editorContext,
              instance
            });
          }}
          className={buildClassName(
            { shouldAdd: collapsed, className: 'fullscreen' }
          )}
        />
        <a
          className={buildClassName(
            'collapse',
            'material-icons',
            { shouldAdd: collapsed, className: 'closed' },
            { shouldAdd: !collapsed, className: 'open' }
          )}
          onClick={() => setCollapsed(!collapsed)}
          title="Collapse"
        ></a>
        <div className={buildClassName(
            'editor-side-panel',
            { shouldAdd: collapsed, className: 'hidden' }
        )}>
          <div>
            <div className="editor-actions">
              <Transpile
                model={editorContext.model}
                onShare={() => setShare(true)}
                showError={showError}
              />
              {editorContext.instance ? (
                <Execute
                  instance={editorContext.instance}
                  model={editorContext.model}
                  showError={showError}
                  setDebug={setDebug}
                />
              ) : null}
              <div className="editor-help">
                <label>Try this:</label>
                <code>
                  <span className="identifier">get_shell</span>(
                  <span className="string">"root"</span>,{' '}
                  <span className="string">"test"</span>){' '}
                  <span className="comment">
                    //to receive root shell on your local pc
                  </span>
                </code>
              </div>
            </div>
          </div>
        </div>
        <div className="readme">
          <ExternalLinks externalLinks={options.externalLinks} />
        </div>
      </div>
    </article>
  );
}
