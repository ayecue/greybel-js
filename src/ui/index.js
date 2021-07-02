const build = require('../build-light');
const VM = require('../emulator/ui/vm');
const Stdout = require('./src/utils/Stdout');
const Stdin = require('./src/utils/Stdin');
const codemirror = require('@codemirror/basic-setup');
const EditorState = codemirror.EditorState;
const basicSetup = codemirror.basicSetup;
const codemirrorView = require('@codemirror/view');
const EditorView = codemirrorView.EditorView;
const keymap = codemirrorView.keymap;
const defaultTabBinding = require('@codemirror/commands').defaultTabBinding;
const javascript = require('@codemirror/lang-javascript').javascript;

const transpileEl = document.getElementById('transpile');
const transpileOutputEl = document.getElementById('toutput');
const uglifyEl = document.getElementById('uglify');
const executeEl = document.getElementById('execute');
const stdoutEl = document.getElementById('stdout');
const stdinEl = document.getElementById('stdin');
const editorState = EditorState.create({
	doc: localStorage.getItem('ide-content') || 'print("Hello world")',
	extensions: [
		basicSetup,
		EditorView.updateListener.of((v) => {
			if (v.docChanged) {
				localStorage.setItem('ide-content', v.state.doc.toString())
			}
		}),
		keymap.of([defaultTabBinding]),
		javascript()
	]
});
const editorView = new EditorView({
	state: editorState,
	parent: document.getElementById('container')
});
const vmInstance = new VM();
const stdout = new Stdout(stdoutEl);
const stdin = new Stdin(stdinEl);

vmInstance.start(stdout, stdin);

transpileEl.addEventListener('click', () => {
	const output = build({
		uglify: uglifyEl.checked,
		content: editorView.state.doc.toString()
	});

	transpileOutputEl.value = output;
});

executeEl.addEventListener('click', () => {
	const shell = vmInstance.getLastSession();

	shell.run(editorView.state.doc.toString());
});