const shell = require('./shell');
const generic = require('./generic');
const includeLib = require('./include-lib');

module.exports = function(vm) {
	return {
		...shell(vm),
		...generic(vm),
		...includeLib(vm)
	};
};