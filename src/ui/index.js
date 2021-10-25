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

const editorErrorsEl = document.getElementById('editor-errors');
const transpileEl = document.getElementById('transpile');
const transpileOutputEl = document.getElementById('toutput');
const uglifyEl = document.getElementById('uglify');
const obfuscationEl = document.getElementById('obfuscation');
const disableLiteralsOptimizationEl = document.getElementById('disableLiteralsOptimization');
const disableNamespacesOptimizationEl = document.getElementById('disableNamespacesOptimization');
const excludedNamespacesEl = document.getElementById('excludedNamespaces');
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
const showError = function(msg, timeout) {
	const errorEl = document.createElement('div');

	errorEl.innerHTML = msg;
	editorErrorsEl.appendChild(errorEl);

	const timer = setTimeout(() => editorErrorsEl.removeChild(errorEl), timeout || 10000);
	errorEl.addEventListener('click', () => {
		clearTimeout(timer);
		editorErrorsEl.removeChild(errorEl);
	});
};

(async () => {
	while (true) {
		console.error('VM is ready...');
		await vmInstance.start(stdout, stdin);
		console.error('VM shutdown. Restarting...');
	}
})();

transpileEl.addEventListener('click', () => {
	try {
		const output = build({
			uglify: uglifyEl.checked,
			obfuscation: obfuscationEl.checked,
			disableLiteralsOptimization: disableLiteralsOptimizationEl.checked,
			disableNamespacesOptimization: disableNamespacesOptimizationEl.checked,
			excludedNamespaces: excludedNamespacesEl.value.split(",").map(function(v) {
				return v.trim();
			}),
			content: editorView.state.doc.toString()
		});

		transpileOutputEl.value = output;
	} catch (err) {
		showError(err.message);
	}
});

stdoutEl.addEventListener('click', () => {
	stdinEl.focus();
});

executeEl.addEventListener('click', async () => {
	const shell = vmInstance.getLastSession();
	const result = await shell.run(editorView.state.doc.toString());

	if (!result.success) {
		showError(result.error.message);
	}
});