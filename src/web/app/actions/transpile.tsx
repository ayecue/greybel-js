import React, { useState } from 'react';

import build from '../../transpile.js';
import { buildClassName } from '../utils.js';

export interface TranspileOptions {
  content: string;
  className?: string;
  onError: (err: any) => void;
}

export default function Transpile({ content, className, onError }: TranspileOptions) {
  const [transformResult, setTransformResult] = useState('');
  const [buildType, setBuildType] = useState('0');
  const [keepParens, setKeepParens] = useState(false);
  const [usesTab, setUsesTab] = useState(true);
  const [whitespaceAmount, setWhitespaceAmount] = useState(2);
  const [obfuscation, setObfuscation] = useState(false);
  const [disableLO, setDisableLO] = useState(false);
  const [disableNO, setDisableNO] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [excludedNamespaces, setExcludedNamespaces] = useState('');
  const transpile = async () => {
    try {
      const output = await build(content, {
        uglify: buildType === '1',
        beautify: buildType === '2',
        beautifyKeepParentheses: keepParens,
        beautifyIndentation: usesTab ? 0 : 1,
        beautifyIndentationSpaces: whitespaceAmount,
        obfuscation,
        disableLiteralsOptimization: disableLO,
        disableNamespacesOptimization: disableNO,
        excludedNamespaces: excludedNamespaces
          .split(',')
          .map(function (v: any) {
            return v.trim();
          })
      });

      setTransformResult(output);
    } catch (err: any) {
      console.error(err);
      onError?.(err);
    }
  };

  return (
    <div className={buildClassName('editor-transpile', {
      shouldAdd: !!className,
      className: className
    })}>
      <div className="actions">
        <a
          id="transpile"
          className="material-icons"
          title="Transpile"
          onClick={() => transpile()}
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
      <div
        className={buildClassName('editor-options', {
          shouldAdd: collapsed,
          className: 'hidden'
        })}
      >
        <ul>
          <li>
            <select
              id="buildType"
              onChange={(ev) => setBuildType(ev.target.value)}
              defaultValue="0"
            >
              <option value="0">Default</option>
              <option value="1">Uglify</option>
              <option value="2">Beautify</option>
            </select>
            <label>Build type</label>
          </li>
          <li onClick={() => setObfuscation(!obfuscation)}>
            <input
              id="obfuscation"
              type="checkbox"
              checked={obfuscation}
              readOnly
            />
            <label>Obfuscation</label>
          </li>
          <li onClick={() => setDisableLO(!disableLO)}>
            <input
              id="disableLiteralsOptimization"
              type="checkbox"
              checked={disableLO}
              readOnly
            />
            <label>Disable literals optimization</label>
          </li>
          <li onClick={() => setDisableNO(!disableNO)}>
            <input
              id="disableNamespacesOptimization"
              type="checkbox"
              checked={disableNO}
              readOnly
            />
            <label>Disable namespaces optimization</label>
          </li>
          <li>
            <label>Exclude namespaces from optimization</label>
            <input
              id="excludedNamespaces"
              type="text"
              onChange={(ev) => setExcludedNamespaces(ev.target.value)}
            />
          </li>
          <li onClick={() => setKeepParens(!keepParens)}>
            <input
              id="keepParens"
              type="checkbox"
              checked={keepParens}
              readOnly
            />
            <label>Keep parentheses</label>
          </li>
          <li onClick={() => setUsesTab(!usesTab)}>
            <input
              id="usesTab"
              type="checkbox"
              checked={usesTab}
              readOnly
            />
            <label>Use tabs</label>
          </li>
          <li>
            <label>Whitespace amount</label>
            <input
              id="whitespaceAmount"
              type="number"
              onChange={(ev) => setWhitespaceAmount(parseInt(ev.target.value))}
            />
          </li>
        </ul>
      </div>
      <div className="output">
        <label>Transpiler output:</label>
        <textarea
          id="toutput"
          className="editor-transpiled-area"
          readOnly
          value={transformResult}
        />
      </div>
    </div>
  );
}
