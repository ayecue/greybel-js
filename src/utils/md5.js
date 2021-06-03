const crypto = require('crypto');

module.exports = function(string) {
	return crypto.createHash('md5').update(string).digest('hex');
};