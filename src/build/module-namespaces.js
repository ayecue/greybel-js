const NamespaceGenerator = require('./namespace-generator');
const CHARSET = require('./charset').MODULES;

module.exports = new NamespaceGenerator(CHARSET, [], []);