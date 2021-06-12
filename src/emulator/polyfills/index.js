const shell = require('./shell');
const generic = require('./generic');

module.exports = function(vm) {
	return {
		...shell(vm),
		...generic(vm)
	};
};