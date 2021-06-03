const NamespaceGenerator = require('../utils/namespace-generator');
const CHARSET = require('./charset').MODULES;

module.exports = new NamespaceGenerator(CHARSET, [], []);