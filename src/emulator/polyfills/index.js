const shell = require('./shell');
const generic = require('./generic');
const includeLib = require('./include-lib');
const math = require('./math');

module.exports = function(vm) {
	return {
		...shell(vm),
		...generic(vm),
		...includeLib(vm),
		...math(vm)
	};
};