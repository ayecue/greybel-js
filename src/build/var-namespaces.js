const NamespaceGenerator = require('./namespace-generator');
const CHARSET = require('./charset').VARS;
const DEFAULT_NAMESPACES = [
	'BACKSLASH_CODE',
	'NEW_LINE_OPERATOR',
	'MODULES',
	'EXPORTED',
	'__REQUIRE',
	'MAIN',
	'module'
];
const varNamespaces = new NamespaceGenerator(CHARSET, [], DEFAULT_NAMESPACES);

module.exports = varNamespaces;