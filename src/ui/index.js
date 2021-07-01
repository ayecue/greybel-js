const build = require('../build-light');
const VM = require('../emulator/ui/vm');
const Editor = require('./src/components/editor');
const Stdout = require('./src/utils/Stdout');
const Stdin = require('./src/utils/Stdin');

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