import {
  Debugger,
  Interpreter,
  OperationContext
} from 'greybel-interpreter';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useEffect, useRef, useState } from 'react';

import execute from '../execute';
import { Stdin, Stdout } from '../std';
import { DebugPopup } from './popups';

export interface ExecuteOptions {
  model: Monaco.editor.ITextModel;
  showError: (msg: string, timeout?: number) => void;
  instance: Monaco.editor.IStandaloneCodeEditor;
  setDebug: (debugOptions: DebugPopup | undefined) => void;
}

export default function Execute({ model, showError, instance, setDebug }: ExecuteOptions) {
  const stdoutRef = useRef<HTMLDivElement>(null);
  const stdinRef = useRef<HTMLInputElement>(null);
  const [stdout, setStdout] = useState<Stdout | undefined>(undefined);
  const [stdin, setStdin] = useState<Stdin | undefined>(undefined);
  const [parameters, setParameters] = useState('');
  const [seed, setSeed] = useState('test');
  const [interpreter, setInterpreter] = useState<Interpreter | null>(null);
  const run = () => {
    if (interpreter !== null) return;

    let activeInterpreter: Interpreter | null = null;

    execute(model, {
      stdin,
      stdout,
      params: parameters.split(' ').filter((v) => v !== ''),
      seed,
      onStart: (interpreter: Interpreter) => {
        activeInterpreter = interpreter;
        setInterpreter(activeInterpreter);
      },
      onEnd: (_interpreter: Interpreter) => {
        setInterpreter(null);
      },
      onError: (err: any) => {
        showError(err.message);
        setInterpreter(null);
      },
      onInteract: (
        dbgr: Debugger,
        context: OperationContext
      ): Promise<void> => {
        let lastActiveLine: Element | undefined;

        return new Promise((resolve, _reject) => {
          setDebug({
            context,
            onContinue: () => {
              dbgr.setBreakpoint(false);
              setDebug(undefined);
              lastActiveLine?.classList.remove('highlight');
              resolve();
            },
            onExecute: async (input: string) => {
              try {
                dbgr.setBreakpoint(false);
                await activeInterpreter?.injectInLastContext(input);
              } catch (err: any) {
                console.error(err);
              } finally {
                dbgr.setBreakpoint(true);
              }
            },
            onNext: () => {
              dbgr.next();
              setDebug(undefined);
              lastActiveLine?.classList.remove('highlight');
              resolve();
            }
          });

          const line =
            activeInterpreter?.globalContext.getLastActive()?.stackItem?.start!
              .line || -1;

          if (line !== -1) {
            lastActiveLine = Array.from(
              document.querySelectorAll(`.line-numbers`)
            ).find((item: Element) => {
              return item.textContent === line.toString();
            });

            lastActiveLine?.classList.add('highlight');
            instance.revealLineInCenter(line);
          }
        });
      }
    });
  };
  const pause = () => {
    if (interpreter === null) return;

    interpreter.debugger.setBreakpoint(true);
  };
  const stop = () => {
    if (interpreter === null) return;

    interpreter.exit();
  };

  useEffect(() => {
    setStdout(new Stdout(stdoutRef.current));
    setStdin(new Stdin(stdinRef.current));
  }, []);

  return (
    <div className="editor-execute">
      <div className="context">
        <label>Execution parameter:</label>
        <input
          id="params"
          type="text"
          onChange={(ev) => setParameters(ev.target.value)}
        />
      </div>
      <div className="context">
        <label>Seed:</label>
        <input
          id="seed"
          type="text"
          value={seed}
          onChange={(ev) => setSeed(ev.target.value)}
        />
      </div>
      <div className="actions">
        <a id="execute" onClick={run} className={interpreter ? 'disabled' : ''}>
          Execute
        </a>
        <a
          id="pause"
          onClick={pause}
          className={!interpreter ? 'disabled' : ''}
        >
          Pause
        </a>
        <a id="stop" onClick={stop} className={!interpreter ? 'disabled' : ''}>
          Stop
        </a>
        <a id="clear" onClick={() => stdout?.clear()}>
          Clear
        </a>
      </div>
      <label>Execution output:</label>
      <div
        id="stdout"
        className="editor-console-stdout"
        ref={stdoutRef}
        onClick={() => stdinRef.current?.focus()}
      ></div>
      <input
        id="stdin"
        className="editor-console-stdin"
        type="text"
        disabled
        ref={stdinRef}
      />
    </div>
  );
}