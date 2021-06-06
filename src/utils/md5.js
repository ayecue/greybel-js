const crypto = require('crypto');

module.exports = function(string) {
	if (typeof string !== 'string') return null;
	return crypto.createHash('md5').update(string).digest('hex');
};