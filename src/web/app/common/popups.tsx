import { VM, ObjectValue } from 'greybel-interpreter';
import React, { useEffect, useRef, useState } from 'react';

import viewJSON from '../../json-viewer.js';

export interface DebugReplOptions {
  onExecute: (replInput: string) => void;
  onContinue: () => void;
  onNext: () => void;
}

export function DebugReplPopup({
  onExecute,
  onContinue,
  onNext
}: DebugReplOptions) {
  const [replInput, setReplInput] = useState('');

  return (
    <div className="debugger-popup-navigation">
      <div className="debugger-repl-wrapper">
        <input
          type="text"
          className="debugger-repl"
          onChange={(ev) => {
            setReplInput(ev.target.value);
          }}
          value={replInput}
          onKeyUp={(ev) => {
            if (ev.key === 'Enter' || ev.keyCode === 13) {
              onExecute(replInput);
              setReplInput('');
            }
          }}
        />
        <input
          type="button"
          className="debugger-repl-execute"
          value="Execute"
          onClick={() => {
            onExecute(replInput);
            setReplInput('');
          }}
        />
      </div>
      <div className="debugger-actions">
        <input
          type="button"
          className="debugger-continue"
          value="Continue"
          onClick={onContinue}
        />
        <input
          type="button"
          className="debugger-next"
          value="Next"
          onClick={onNext}
        />
      </div>
    </div>
  );
}

export function DebugScopePopup({
  vm
}: {
  vm: VM;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scope = vm.getFrame();
    const scopes: ObjectValue[] = [];

    while (scope != null) {
      scopes.push(scope.locals.scope.value);
      scope = scope.outer;
    }

    containerRef.current!.appendChild(viewJSON(scopes));
  }, []);

  return (
    <div className="debugger-popup-scope">
      <div ref={containerRef}></div>
    </div>
  );
}

export interface DebugPopup {
  vm: VM;
  onExecute: (input: string) => void;
  onContinue: () => void;
  onNext: () => void;
}

export interface SharePopup {
  content: string;
  active: boolean;
  onClose: () => void;
}

export interface EditorPopupsOptions {
  share: SharePopup;
  debug?: DebugPopup;
}

export default function EditorPopups(options: EditorPopupsOptions) {
  const popups: JSX.Element[] = [];

  if (options.share.active) {
    const { content, onClose } = options.share;

    const url = new URL(location.href);
    let b64Content = '';

    try {
      // prevent none latin1 signs
      const encoded = encodeURIComponent(content);
      b64Content = btoa(encoded);
    } catch (err: any) {
      console.error(err);
    }

    //clear all params
    for (const key of url.searchParams.keys()) {
      url.searchParams.delete(key);
    }

    url.searchParams.set('c', b64Content);

    popups.push(
      <div
        key={'share-popup-bg'}
        className="share-popup-bg"
        onClick={onClose}
      ></div>,
      <div key={'share-popup'} className="share-popup">
        <a onClick={onClose}></a>
        <textarea readOnly value={url.toString()} />
      </div>
    );
  }

  if (options.debug) {
    const { vm, onExecute, onContinue, onNext } = options.debug;

    popups.push(
      <div key="debugger-popup-bg" className="debugger-popup-bg"></div>,
      <DebugReplPopup
        key="debugger-repl-popup"
        onExecute={onExecute}
        onContinue={onContinue}
        onNext={onNext}
      />,
      <DebugScopePopup key="debugger-scope-popup" vm={vm} />
    );
  }

  return <div id="editor-popups">{popups}</div>;
}
