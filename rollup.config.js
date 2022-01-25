const path = require('path');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const json = require('@rollup/plugin-json');
const nodePolyfills = require('rollup-plugin-polyfill-node');

const options = {
    input: 'out/web.js',
    output: {
        file: 'out/web.bundled.js',
        format: 'iife'
    },
    plugins: [
        json(),
        commonjs(),
        nodePolyfills(),
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        babel({
            presets: ['@babel/preset-env', {
                exclude: "transform-typeof-symbol"
            }],
            babelHelpers: 'runtime',
            plugins: [
                ["@babel/plugin-transform-runtime", {
                    regenerator: true
                }]
            ]
        })/*,
        terser()*/
    ]
};

export default options;