const BOILERPLATES = require('../boilerplates/index');
const moduleNamespaces = require('./module-namespaces');
const varNamespaces = require('./var-namespaces');
const Tranformer = require('./builder/transformer');
const literals = require('./literals');

module.exports = function(mainDependency, mapper, optimizeLiterals, isNativeImport) {
	const tempVarForGlobal = varNamespaces.createNamespace('globals');
	const transformer = new Tranformer(mapper);
	const mainModuleName = moduleNamespaces.get(mainDependency.getId())
	const headerBoilerplate = transformer.transform(BOILERPLATES.HEADER_BOILERPLATE);
	const moduleBoilerplate = transformer.transform(BOILERPLATES.MODULE_BOILERPLATE);
	const mainBoilerplate = transformer.transform(BOILERPLATES.MAIN_BOILERPLATE);
	const modules = {};
	const iterator = function(item) {
		const moduleName = moduleNamespaces.get(item.getId());
		let dependency;

		if (moduleName in modules) return;
		if (moduleName != mainModuleName && !item.isInclude) {
			const code = transformer.transform(item.chunk, item);
			modules[moduleName] = moduleBoilerplate.replace('"$0"', '"' + moduleName + '"').replace('"$1"', code);
		}
		
		for (dependency of item.dependencies) iterator(dependency);
	};

	iterator(mainDependency);

	const processed = [];

	if (!isNativeImport) {
		if (optimizeLiterals) {
			const literalMapping = literals.getMapping();

			processed.push('globals.' + tempVarForGlobal + '=globals');

			Object.values(literalMapping).forEach(function(literal) {
				if (literal.namespace == null) return;
				processed.push(tempVarForGlobal + '.' + literal.namespace + '=' + literal.literal.raw);
			});
		}
	
		processed.push(headerBoilerplate);
	}

	for (let moduleKey in modules) processed.push(modules[moduleKey]);
	
	const code = transformer.transform(mainDependency.chunk, mainDependency);

	if (isNativeImport) {
		processed.push(code);
	} else {
		const moduleCode = mainBoilerplate.replace('"$0"', code);
		processed.push(moduleCode);
	}
	
	return processed.join('\n');
};