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
		obfuscation: false,
		excludedNamespaces: [],
		disableLiteralsOptimization: false,
		disableNamespacesOptimization: false
	}, options);

	envs.load(buildOptions.envFiles, buildOptions.envVars);

	const charsetMap = charset(buildOptions.obfuscation);
	const optimizationOptions = {
		literals: buildOptions.uglify && !buildOptions.disableLiteralsOptimization,
		namespaces: buildOptions.uglify && !buildOptions.disableNamespacesOptimization
	};
	let mapper = defaultMapper;

	if (buildOptions.uglify) mapper = uglifyMapper;

	varNamespaces
		.reset()
		.preset(charsetMap.VARS);
	varNamespaces.exclude(options.excludedNamespaces);
	moduleNamespaces
		.reset()
		.preset(charsetMap.MODULES);
	literals.reset();

	const parser = new Parser(buildOptions.content, optimizationOptions);
	const chunk = parser.parseChunk();
	const transformer = new Tranformer(mapper);
	const tempVarForGlobal = varNamespaces.createNamespace('UNIQUE_GLOBAL_TEMP_VAR');
	const processed = [];

	if (optimizationOptions.literals) {
		const literalMapping = literals.getMapping();

		processed.push('globals.' + tempVarForGlobal + '=globals');

		Object.values(literalMapping).forEach(function(literal) {
			if (literal.namespace == null) return;
			processed.push(tempVarForGlobal + '.' + literal.namespace + '=' + literal.literal.raw);
		});
	}

	processed.push(transformer.transform(chunk, null));

	return processed.join('\n');
};