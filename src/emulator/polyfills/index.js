const shell = require('./shell');
const generic = require('./generic');
const includeLib = require('./include-lib');
const math = require('./math');
const router = require('./router');
const features = require('./features');

module.exports = function(contextShell) {
	return {
		...shell(contextShell),
		...generic(contextShell),
		...includeLib(contextShell),
		...math(contextShell),
		...router(contextShell),
		...features(contextShell)
	};
};