const defaultMapper = require('./build/builder/default');
const uglifyMapper = require('./build/builder/uglify');
const varNamespaces = require('./build/var-namespaces');
const moduleNamespaces = require('./build/module-namespaces');
const Parser = require('./parser');
const envs = require('./build/envs');
const literals = require('./build/literals');
const charset = require('./build/charset');
const Tranformer = require('./build/builder/transformer');

module.exports = function(options = {}) {
	const buildOptions = Object.assign({
		uglify: false,
		maxWords: 80000,
		obfuscation: true
	}, options);

	envs.load(options.envFiles, options.envVars);

	const charsetMap = charset(options.obfuscation);
	let mapper = defaultMapper;

	if (options.uglify) mapper = uglifyMapper;

	varNamespaces
		.reset()
		.preset(charsetMap.VARS);
	moduleNamespaces
		.reset()
		.preset(charsetMap.MODULES);
	literals.reset();

	const parser = new Parser(options.content, options.uglify);
	const chunk = parser.parseChunk();
	const transformer = new Tranformer(mapper);

	return transformer.transform(chunk, null);
};