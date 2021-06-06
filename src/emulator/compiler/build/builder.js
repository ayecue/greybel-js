const mapper = require('./builder/default');
const Tranformer = require('./builder/transformer');
const fs = require('fs');
const path = require('path');

const polyfills = [
	'util',
	'primaries',
	'generic',
	'shell'
].map((filename) => {
	const target = path.resolve(__dirname, 'polyfills', filename + '.js');
	return fs.readFileSync(target).toString();
});

module.exports = function(chunk) {
	const transformer = new Tranformer(mapper);
	const projectFolder = path.resolve(__dirname, '..', '..');
	const body = [
		'module.exports = async function($VM_INSTANCE, $PARAMS_MAP, exit) {',
			`global.globals = global;`,
			`const $PROJECT_FOLDER = "${projectFolder}";`,
			...polyfills,
			transformer.transform(chunk),
		'}'
	];

	return body.join('\n');
};