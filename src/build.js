const defaultMapper = require('./build/builder/default');
const uglifyMapper = require('./build/builder/uglify');
const builder = require('./build/builder');
const varNamespaces = require('./build/var-namespaces');
const moduleNamespaces = require('./build/module-namespaces');
const Dependency = require('./build/dependency');
const Parser = require('./parser');
const util = require('util');
const fs = require('fs');
const path = require('path');
const envs = require('./build/envs');
const literals = require('./build/literals');
const logger = require('node-color-log');
const charset = require('./build/charset');

const Builder = function(filepath, output, name) {
	const me = this;

	if (filepath == null || !fs.existsSync(filepath)) {
		throw new Error('File ' + filepath + ' does not exist...');
	}

	if (output != null && !fs.existsSync(output)) {
		throw new Error('Output directory ' + filepath + ' does not exist...');
	}

	me.filepath = path.resolve(filepath);

	const parsed = path.parse(me.filepath);

	me.output = path.resolve(output || parsed.dir, name || parsed.name + '.output.src');

	return me;
};

Builder.prototype.compile = function(options) {
	const me = this;
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

	const content = fs.readFileSync(me.filepath, {
		encoding: 'utf-8'
	});
	logger.info('Parsing: ' + me.filepath);
	const parser = new Parser(content, options.uglify);
	const chunk = parser.parseChunk();
	const dependency = new Dependency(me.filepath, chunk, options.uglify);
	dependency.findDependencies();

	const code = builder(dependency, mapper, options.uglify);
	const words = code.length;

	if (words > options.maxWords) {
		logger.warn('WARNING: Exceeding max word limit by ' + (words - options.maxWords) + ' signs. Building anyway.');
	}

	logger.info('Created file:', me.output);
	fs.writeFileSync(me.output, code, {
		encoding: 'utf-8'
	});

	logger.info('Created ast file:', me.output + '.json');
	fs.writeFileSync(me.output + '.json', JSON.stringify(chunk, null, 4), {
		encoding: 'utf-8'
	});
};

module.exports = function(filepath, output, options) {
	const buildOptions = Object.assign({
		uglify: false,
		maxWords: 80000,
		obfuscation: true
	}, options);
	const builder = new Builder(filepath, output, options.name);

	envs.load(options.envFiles, options.envVars);

	return builder.compile(buildOptions);
};