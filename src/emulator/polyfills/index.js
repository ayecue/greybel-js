const shell = require('./shell');
const generic = require('./generic');
const includeLib = require('./include-lib');
const math = require('./math');
const router = require('./router');

module.exports = function(contextShell) {
	return {
		...shell(contextShell),
		...generic(contextShell),
		...includeLib(contextShell),
		...math(contextShell),
		...router(contextShell)
	};
};