const esbuild = require('esbuild');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');
const globalsPlugin = require('esbuild-plugin-globals');
const dotenv = require('dotenv');
const envObj = dotenv.config().parsed;

const build = async () => {
  try {
    await esbuild
      .build({
        entryPoints: ['./out/web.js'],
        bundle: true,
        platform: 'node',
        outfile: 'out/web.bundled.js',
        sourcemap: false,
        minify: true,
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        target: 'ESNext',
        platform: 'browser',
        treeShaking: true,
        external: [
          'react',
          'react-dom',
          'react-dom/client',
          'prismjs',
          'react-markdown',
          'react-in-viewport'
        ],
        define: {
          'process.env.NODE_ENV': '"production"',
          ...Object.entries(envObj).reduce((result, [key, value]) => {
            result[`process.env.${key}`] = `"${value}"`;
            return result;
          }, {})
        },
        plugins: [
          globalsPlugin({
            'react': 'React',
            'react-dom': 'ReactDOM',
            'react-dom/client': 'ReactDOM',
            'prismjs': '{"$":"prismjs","languages":{}}',
            'react-markdown': '{"$":"react-markdown"}',
            'react-in-viewport': '{"$":"react-in-viewport"}'
          }),
          polyfillNode({
            globals: false
          })
        ]
      });
  } catch (err) {
    console.error('Failed building project', { err });
    process.exit(1);
  }
};

build();
