const NamespaceGenerator = require('../utils/namespace-generator');
const DEFAULT_NAMESPACES = [
	'BACKSLASH_CODE',
	'NEW_LINE_OPERATOR',
	'MODULES',
	'EXPORTED',
	'__REQUIRE',
	'MAIN',
	'module'
];
const varNamespaces = new NamespaceGenerator(null, [], DEFAULT_NAMESPACES);

module.exports = varNamespaces;