const build = require('../../src/build-light');
const VM = require('./emulator/vm');
const Editor = require('./components/editor');
const Stdout = require('./utils/Stdout');
const Stdin = require('./utils/Stdin');

hljs.initHighlightingOnLoad();

ReactDOM.render(
    React.createElement(Editor, {
    	build: build,
    	VM: VM,
    	Stdout: Stdout,
    	Stdin: Stdin
    }),
    document.getElementById('container')
);