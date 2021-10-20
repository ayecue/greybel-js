const NamespaceGenerator = require('../utils/namespace-generator');
const NATIVES = require('../parser/natives');

module.exports = new NamespaceGenerator(null, [].concat(NATIVES), []);