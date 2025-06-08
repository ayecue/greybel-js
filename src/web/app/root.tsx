import React, { useEffect, useState } from 'react';
import GitHubButton from 'react-github-btn'

import Execute from './actions/execute.js';
import Transpile from './actions/transpile.js';
import ErrorList, { ErrorEntry } from './common/error-list.js';
import ExternalLinks, { AppExternalLink } from './common/external-links.js';
import EditorPopups, { DebugPopup } from './common/popups.js';
import { EditorContext, EditorRoot } from './editor/index.js';
import { buildClassName, guid, setQueryStringParameter } from './utils.js';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export interface RootOptions {
  initContent?: string;
  externalLinks: AppExternalLink[];
}

export function Root(options: RootOptions) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(
    null
  );
  const [content, setContent] = useState(options.initContent);
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[]>([]);
  const [share, setShare] = useState<boolean>(false);
  const [debug, setDebug] = useState<DebugPopup | undefined>(undefined);
  const [savePending, setSavePending] = useState(false);
  const activeErrors: ErrorEntry[] = [];

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

  const onSave = async () => {
    if (savePending) {
      return;
    }

    setSavePending(true);

    try {
      const response = await fetch(`${process.env.EDITOR_SERVICE_URL}/code`, {
        method: 'post',
        body: JSON.stringify({
          content
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      setQueryStringParameter('id', data.id);
    } catch (err) {
      console.error(err);
      showError('Cannot save code!');
    } finally {
      setSavePending(false);
    }
  };

  return (
    <div>
      <ErrorList errors={errorEntries} />
      <EditorPopups
        share={{
          active: share,
          content,
          onClose: () => setShare(false)
        }}
        debug={debug}
      />
      <div className="editor-control">
        <PanelGroup direction="vertical" id="root-group">
          <div
            className={buildClassName('editor-top-panel')}
          >
            <a
              id="share"
              className="material-icons"
              title="Share"
              onClick={() => setShare(true)}
            ></a>
            <a
              id="save"
              className={buildClassName('material-icons', {
                shouldAdd: savePending,
                className: 'disabled'
              })}
              title="Save"
              onClick={() => onSave()}
            ></a>
          </div>
          <Panel id="top-panel">
            <EditorRoot
              initialContent={options.initContent}
              onChange={(newContent) => {
                setContent(newContent);
                localStorage.setItem('ide-content', newContent);
              }}
              onError={(err) => showError(err.message)}
              onCreate={(context) => setEditorContext(context)}
            />
          </Panel>
          <PanelResizeHandle id="resize-root-handle" />
          <Panel id="bottom-panel" collapsedSize={5} minSize={5} defaultSize={10} collapsible={true}>
            <div
              className={buildClassName('editor-bottom-panel')}
            >
              <PanelGroup direction="horizontal" id="actions-group" style={{ overflow: 'auto'}}>
                <Panel id="left-panel" collapsedSize={10} minSize={10} collapsible={true}>
                  <Transpile
                    content={content}
                    onError={(err) => showError(err.message)}
                  />
                </Panel>
                <PanelResizeHandle id="resize-actions-handle" />
                <Panel id="right-panel" collapsedSize={20} minSize={20} collapsible={true} style={{ overflow: 'auto'}}>
                  <Execute
                    content={content}
                    onNewActiveLine={(line) =>
                      editorContext.instance.revealLineInCenter(line)
                    }
                    onError={(err) => showError(err.message)}
                    setDebug={setDebug}
                    />
                </Panel>
              </PanelGroup>
            </div>
          </Panel>
        </PanelGroup>
      </div>
      <div className="readme">
        <div className="github-button">
          <GitHubButton href="https://github.com/ayecue/greybel-js" data-color-scheme="no-preference: dark; light: light; dark: dark;" data-icon="octicon-star" data-size="large" aria-label="Star ayecue/greybel-js on GitHub">Star</GitHubButton>
        </div>
        <ExternalLinks className="external-links-wrapper" externalLinks={options.externalLinks} />
      </div>
    </div>
  );
}

export interface RootWithIdOptions extends RootOptions {
  id: string;
}

export function RootWithId(options: RootWithIdOptions) {
  const [entity, setEntity] = useState<{ id: string; content: string }>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${process.env.EDITOR_SERVICE_URL}/code/${options.id}`)
      .then((response) => response.json())
      .then((data) => setEntity(data))
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  }, []);

  if (entity === null && !failed) {
    return <div>Loading...</div>;
  }

  if (failed) {
    return (
      <Root
        initContent={options.initContent}
        externalLinks={options.externalLinks}
      />
    );
  }

  return (
    <Root initContent={entity.content} externalLinks={options.externalLinks} />
  );
}
