import React, { useEffect, useState } from 'react';
import GitHubButton from 'react-github-btn'

import Execute from './actions/execute.js';
import Transpile from './actions/transpile.js';
import ErrorList, { ErrorEntry } from './common/error-list.js';
import ExternalLinks, { AppExternalLink } from './common/external-links.js';
import EditorPopups, { DebugPopup } from './common/popups.js';
import { EditorContext, EditorRoot } from './editor/index.js';
import { buildClassName, guid, setQueryStringParameter } from './utils.js';

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
  const [collapsed, setCollapsed] = useState(false);
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
        <EditorRoot
          initialContent={options.initContent}
          onChange={(newContent) => {
            setContent(newContent);
            localStorage.setItem('ide-content', newContent);
          }}
          onError={(err) => showError(err.message)}
          onCreate={(context) => setEditorContext(context)}
          collapsed={collapsed}
        />
        <div
          className={buildClassName('editor-side-panel', {
            shouldAdd: collapsed,
            className: 'hidden'
          })}
        >
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
          <div>
            <div className="editor-actions">
              <div className="editor-main">
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
              <Transpile
                content={content}
                onError={(err) => showError(err.message)}
              />
              <Execute
                content={content}
                onNewActiveLine={(line) =>
                  editorContext.instance.revealLineInCenter(line)
                }
                onError={(err) => showError(err.message)}
                setDebug={setDebug}
              />
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
      </div>
      <div className="readme">
        <GitHubButton href="https://github.com/ayecue/greybel-js" data-color-scheme="no-preference: dark; light: light; dark: dark;" data-icon="octicon-star" data-size="large" aria-label="Star ayecue/greybel-js on GitHub">Star</GitHubButton>
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
