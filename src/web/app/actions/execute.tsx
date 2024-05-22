import { Debugger, Interpreter, VM } from 'greybel-interpreter';
import React, { useEffect, useRef, useState } from 'react';

import execute from '../../execute.js';
import { Stdin } from '../../std/stdin.js';
import { StdoutCanvas, StdoutText } from '../../std/stdout.js';
import { DebugPopup } from '../common/popups.js';
import { buildClassName } from '../utils.js';

interface ExecuteOutputOptions {
  onLoadCanvas: (std: StdoutCanvas) => void;
  onLoadText: (std: StdoutText) => void;
  [key: string]: any;
}

function ExecuteOutput(props: ExecuteOutputOptions) {
  const [stdoutCanvas, setStdoutCanvas] = useState<StdoutCanvas | null>(null);
  const [stdoutText, setStdoutText] = useState<StdoutText | null>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idPrefix = props.id ?? 'default';

  useEffect(() => {
    if (stdoutCanvas === null) return;
    props.onLoadCanvas(stdoutCanvas);
  }, [stdoutCanvas]);

  useEffect(() => {
    if (stdoutText === null) return;
    props.onLoadText(stdoutText);
  }, [stdoutText]);

  useEffect(() => {
    if (canvasRef.current === null) return;

    globalThis.createUnityInstance(canvasRef.current, {
      dataUrl: `${process.env.GREYBEL_TERMINAL_URL}/assets/preview.data`,
      frameworkUrl: `${process.env.GREYBEL_TERMINAL_URL}/assets/preview.framework.js`,
      codeUrl: `${process.env.GREYBEL_TERMINAL_URL}/assets/preview.wasm`,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "None",
      productName: "TerminalPreview",
      productVersion: "1.0",
      matchWebGLToCanvasSize: true, // Uncomment this to separately control WebGL canvas render size and DOM element size.
      devicePixelRatio: 1, // Uncomment this to override low DPI rendering on high DPI displays,
    }).then((instance) => {
      globalThis.onUnityInstanceLoad(instance);
      globalThis.postMessage({
        type: 'set-capture-all-keyboard-input',
        capture: false
      });
      setStdoutCanvas(new StdoutCanvas());
    }).catch((err) => console.error('failed loading unity canvas', err.message));
  }, [canvasRef]);

  useEffect(() => {
    if (textRef.current === null) return;
    setStdoutText(new StdoutText(textRef.current));
  }, [textRef]);

  return (
    <div className="editor-console-stdout-wrapper">
      <label>Execution output:</label>
      <div
        { ...props }
        id={`${idPrefix}-text`}
        ref={textRef}
        style={{
          display: stdoutCanvas !== null ? 'none' : 'block'
        }}
      ></div>
      <div
        className="editor-console-stdout-canvas-wrapper"
        style={{
          display: stdoutCanvas === null ? 'none' : 'block'
        }}
      >
        <canvas
          { ...props }
          id={`${idPrefix}-canvas`}
          hidden={stdoutCanvas === null}
          tabIndex={-1}
          ref={canvasRef}
          width="100%"
          height="100%"
          style={{
            width: '100%',
            height: '200px',
            background: '#231F20'
          }}
        >
        </canvas>
      </div>
    </div>
  )
}

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
  const stdinRef = useRef<HTMLInputElement>(null);
  const [stdoutCanvas, setStdoutCanvas] = useState<StdoutCanvas | null>(null);
  const [stdoutText, setStdoutText] = useState<StdoutText | null>(null);
  const [stdin, setStdin] = useState<Stdin | null>(null);
  const [parameters, setParameters] = useState('');
  const [seed, setSeed] = useState('test');
  const [collapsed, setCollapsed] = useState(true);
  const [interpreter, setInterpreter] = useState<Interpreter | null>(null);
  const run = () => {
    if (interpreter !== null) return;

    let activeInterpreter: Interpreter | null = null;

    execute(content, {
      stdin,
      stdoutText,
      stdoutCanvas,
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
        vm: VM
      ): Promise<void> => {
        let lastActiveLine: Element | undefined;

        return new Promise((resolve, _reject) => {
          setDebug({
            vm,
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

          const line = vm.getFrame().getCurrentInstruction().source.start.line || -1;

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
          onClick={() => {
            stdoutText?.clear();
            stdoutCanvas?.clear();
          }}
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
      <div className="std">
        <ExecuteOutput
          id="stdout"
          className="editor-console-stdout"
          onLoadCanvas={(stdout) => setStdoutCanvas(stdout)}
          onLoadText={(stdout) => setStdoutText(stdout)}
          onClick={() => stdinRef.current?.focus()}
        ></ExecuteOutput>
        <input
          id="stdin"
          className="editor-console-stdin"
          type="text"
          disabled
          ref={stdinRef}
        />
      </div>
    </div>
  );
}
