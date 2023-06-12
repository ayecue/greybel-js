import { Debugger, Interpreter, OperationContext } from 'greybel-interpreter';
import React, { useEffect, useRef, useState } from 'react';

import execute from '../../execute.js';
import { Stdin, Stdout } from '../../std.js';
import { DebugPopup } from '../common/popups.js';
import { buildClassName } from '../utils.js';

export interface ExecuteOptions {
  content: string;
  onNewActiveLine: (line: number) => void;
  onError?: (err: any) => void;
  setDebug: (debugOptions: DebugPopup | undefined) => void;
}

export default function Execute({
  content,
  onError,
  onNewActiveLine,
  setDebug
}: ExecuteOptions) {
  const stdoutRef = useRef<HTMLDivElement>(null);
  const stdinRef = useRef<HTMLInputElement>(null);
  const [stdout, setStdout] = useState<Stdout | undefined>(undefined);
  const [stdin, setStdin] = useState<Stdin | undefined>(undefined);
  const [parameters, setParameters] = useState('');
  const [seed, setSeed] = useState('test');
  const [collapsed, setCollapsed] = useState(true);
  const [interpreter, setInterpreter] = useState<Interpreter | null>(null);
  const run = () => {
    if (interpreter !== null) return;

    let activeInterpreter: Interpreter | null = null;

    execute(content, {
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
        console.error(err);
        onError?.(err);
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
            activeInterpreter?.globalContext.getLastActive()?.stackTrace[0]
              ?.item?.start!.line || -1;

          if (line !== -1) {
            lastActiveLine = Array.from(
              document.querySelectorAll(`.line-numbers`)
            ).find((item: Element) => {
              return item.textContent === line.toString();
            });

            lastActiveLine?.classList.add('highlight');
            onNewActiveLine(line);
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
      <div className="actions">
        <a
          id="execute"
          title="Execute"
          onClick={run}
          className={buildClassName('material-icons', {
            shouldAdd: !!interpreter,
            className: 'disabled'
          })}
        ></a>
        <a
          id="pause"
          title="Pause"
          onClick={pause}
          className={buildClassName('material-icons', {
            shouldAdd: !interpreter,
            className: 'disabled'
          })}
        ></a>
        <a
          id="stop"
          title="Stop"
          onClick={stop}
          className={buildClassName('material-icons', {
            shouldAdd: !interpreter,
            className: 'disabled'
          })}
        ></a>
        <a
          id="clear"
          title="Clear"
          onClick={() => stdout?.clear()}
          className="material-icons"
        ></a>
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
      </div>
      <div className="context">
        <ul
          className={buildClassName('items', {
            shouldAdd: collapsed,
            className: 'hidden'
          })}
        >
          <li className="item">
            <label>Execution parameter:</label>
            <input
              id="params"
              type="text"
              onChange={(ev) => setParameters(ev.target.value)}
            />
          </li>
          <li className="item">
            <label>Seed:</label>
            <input
              id="seed"
              type="text"
              value={seed}
              onChange={(ev) => setSeed(ev.target.value)}
            />
          </li>
        </ul>
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
