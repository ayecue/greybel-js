import React, { useState } from 'react';

import minify from '../../minify.js';
import { buildClassName } from '../utils.js';

export interface TranspileOptions {
  content: string;
  onError: (err: any) => void;
}

export default function Transpile({ content, onError }: TranspileOptions) {
  const [transformResult, setTransformResult] = useState('');
  const [buildType, setBuildType] = useState('0');
  const [obfuscation, setObfuscation] = useState(false);
  const [disableLO, setDisableLO] = useState(false);
  const [disableNO, setDisableNO] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [excludedNamespaces, setExcludedNamespaces] = useState('');
  const transpile = async () => {
    try {
      const output = await minify(content, {
        uglify: buildType === '1',
        beautify: buildType === '2',
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
    <div className="editor-transpile">
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
        </ul>
      </div>
      <label>Transpiler output:</label>
      <textarea
        id="toutput"
        className="editor-transpiled-area"
        readOnly
        value={transformResult}
      />
    </div>
  );
}
