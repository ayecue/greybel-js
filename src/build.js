const defaultMapper = require('./build/builder/default');
const uglifyMapper = require('./build/builder/uglify');
const builder = require('./build/builder');
const varNamespaces = require('./build/var-namespaces');
const moduleNamespaces = require('./build/module-namespaces');
const Dependency = require('./build/dependency');
const Parser = require('./parser');
const fs = require('fs');
const path = require('path');
const envs = require('./build/envs');
const literals = require('./build/literals');
const logger = require('node-color-log');
const charset = require('./build/charset');
const handleNativeImports = require('./utils/handle-native-imports');
const createInstaller = require('./utils/create-installer');
const mkdirp = require('mkdirp');

const Builder = function(filepath, output, name, isNativeImport) {
	const me = this;

	if (filepath == null || !fs.existsSync(filepath)) {
		throw new Error('File ' + filepath + ' does not exist...');
	}

	me.filepath = path.resolve(filepath);

	const parsed = path.parse(me.filepath);

	me.output = path.resolve(output || parsed.dir, name || parsed.name + (!isNativeImport ? '.output.src' : '.src'));
	me.isNativeImport = !!isNativeImport;
	me.nativeImportBuilders = [];

	return me;
};

Builder.prototype.compile = function(options) {
	const me = this;
	const charsetMap = charset(options.obfuscation);
	const optimizationOptions = {
		literals: options.uglify && !options.disableLiteralsOptimization,
		namespaces: options.uglify && !options.disableNamespacesOptimization
	};
	let mapper = defaultMapper;

	if (options.uglify) mapper = uglifyMapper;

	if (!me.isNativeImport) {
		varNamespaces
			.reset()
			.preset(charsetMap.VARS);
		varNamespaces.exclude(options.excludedNamespaces);
		moduleNamespaces
			.reset()
			.preset(charsetMap.MODULES);
		literals.reset();
	}

	const content = fs.readFileSync(me.filepath, 'utf8');
	logger.info('Parsing: ' + me.filepath);
	const parser = new Parser(content, optimizationOptions);
	const chunk = parser.parseChunk();

	me.nativeImportBuilders = handleNativeImports(me.filepath, chunk.nativeImports, Builder, me.output, options);

	const dependency = new Dependency(me.filepath, chunk, optimizationOptions);
	dependency.findDependencies();

	return builder(dependency, mapper, optimizationOptions.literals, me.isNativeImport);
};

Builder.prototype.write = function(code, maxWords, installer) {
	const me = this;
	const words = code.length;

	if (words > maxWords) {
		logger.warn('WARNING: Exceeding max word limit by ' + (words - maxWords) + ' signs. Building anyway.');
	}

	logger.info('Created file:', me.output);

	mkdirp.sync(path.dirname(me.output));

	fs.writeFileSync(me.output, code, {
		encoding: 'utf-8'
	});

	if (installer) {
		if (me.nativeImportBuilders.length == 0) {
			logger.warn('WARNING: Unecessary installer usage. There is no usage of import_code.');
		}

		createInstaller(me, maxWords);
	}
}

module.exports = function(filepath, output, options = {}) {
	const buildOptions = Object.assign({
		uglify: false,
		maxWords: 80000,
		obfuscation: true,
		installer: false,
		excludedNamespaces: [],
		disableLiteralsOptimization: false,
		disableNamespacesOptimization: false
	}, options);
	const builder = new Builder(filepath, output, buildOptions.name);

	envs.load(buildOptions.envFiles, buildOptions.envVars);

	const code = builder.compile(buildOptions);

	if (options.noWrite) {
		return code;
	}

	return builder.write(code, buildOptions.maxWords, buildOptions.installer);
};