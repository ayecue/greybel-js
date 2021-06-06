const Parser = require('../parser');
const moduleNamespaces = require('./module-namespaces');
const path = require('path');
const md5 = require('../utils/md5');
const fs = require('fs');
const GLOBAL_DEPENDENCY_MAP = {};
const logger = require('node-color-log');

const Dependency = function(filepath, chunk, collectAll, isInclude) {
	if (isInclude == null) isInclude = false;
	const me = this;
	
	me.target = filepath;
	me.id = md5(filepath);
	me.basePath = path.resolve(filepath, '..');
	me.chunk = chunk;
	me.dependencies = [];
	me.collectAll = collectAll;
	me.isInclude = isInclude;
	
	moduleNamespaces.createNamespace(me.id);
	GLOBAL_DEPENDENCY_MAP[moduleNamespaces.get(me.id)] = me;

	return me;
};

Dependency.prototype.getId = function() {
	return this.id;
};

Dependency.prototype.findDependencies = function() {
	const me = this;
	const items = me.chunk.imports.concat(me.chunk.includes);
	const result = [];
	let item;

	for (item of items) {
		const depFilepath = path.resolve(me.basePath, item.path + '.src');
		const id = md5(depFilepath);
		const namespace = moduleNamespaces.get(id);

		if (namespace in GLOBAL_DEPENDENCY_MAP) {
			const dependency = GLOBAL_DEPENDENCY_MAP[namespace];
			item.chunk = dependency.chunk;
			item.namespace = namespace;
			result.push(dependency);
			continue;
		}

		if (depFilepath == null || !fs.existsSync(depFilepath)) {
			throw new Error('Dependency ' + depFilepath + ' does not exist...');
		}

		const isInclude = item.type === 'FeatureIncludeExpression';
		const content = fs.readFileSync(depFilepath, {
			encoding: 'utf-8'
		});

		logger.info('Parsing: ' + depFilepath);
		const parser = new Parser(content, me.collectAll);
		const chunk = parser.parseChunk();
		item.chunk = chunk;

		const dependency = new Dependency(depFilepath, chunk, me.collectAll, isInclude);
		dependency.findDependencies();
		item.namespace = moduleNamespaces.get(id);

		result.push(dependency);
	}
	
	me.dependencies = result;
	
	return result;
};

module.exports = Dependency;