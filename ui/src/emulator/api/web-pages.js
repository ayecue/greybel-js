const webPages = require('./fixtures/WebPages.json');

exports.getIPByDomain = function(domain) {
	const result = webPages.find((item) => item.Address === domain);

	return result?.PublicIp;
};