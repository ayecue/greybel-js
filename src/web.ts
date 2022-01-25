import execute from './web/execute';
import minify from './web/minify';
import { Stdin, Stdout } from './web/std';

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
		EditorView.updateListener.of((v: any) => {
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
const stdout = new Stdout(stdoutEl);
const stdin = new Stdin(stdinEl);
const showError = function(msg: string, timeout: number = 10000) {
	const errorEl = document.createElement('div');

	errorEl.innerHTML = msg;
	editorErrorsEl?.appendChild(errorEl);

	const timer = setTimeout(() => editorErrorsEl?.removeChild(errorEl), timeout);
	errorEl.addEventListener('click', () => {
		clearTimeout(timer);
		editorErrorsEl?.removeChild(errorEl);
	});
};

transpileEl?.addEventListener('click', async () => {
	try {
		const output = await minify(editorView.state.doc.toString(), {
            // @ts-ignore: Claims value is not defined
			uglify: !!uglifyEl?.checked,
            // @ts-ignore: Claims value is not defined
			obfuscation: !!obfuscationEl?.checked,
            // @ts-ignore: Claims value is not defined
			disableLiteralsOptimization: !!disableLiteralsOptimizationEl?.checked,
            // @ts-ignore: Claims value is not defined
			disableNamespacesOptimization: !!disableNamespacesOptimizationEl?.checked,
            // @ts-ignore: Claims value is not defined
			excludedNamespaces: excludedNamespacesEl?.value?.split(",").map(function(v: any) {
				return v.trim();
			})
		});

        // @ts-ignore: Claims value is not defined
		transpileOutputEl.value = output;
	} catch (err: any) {
		showError(err.message);
	}
});

stdoutEl?.addEventListener('click', () => {
	stdinEl?.focus();
});

executeEl?.addEventListener('click', async () => {
    try {
	    await execute(editorView.state.doc.toString(), {
            stdin,
            stdout
        });
    } catch (err: any) {
        showError(err.message);
    }
});