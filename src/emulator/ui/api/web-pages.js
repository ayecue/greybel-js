const dbClient = require('./db').client;

exports.getIPByDomain = function(domain) {
	const rows = dbClient.queryAll('webPages', {
		query: {
			'Address': domain
		},
		limit: 1
	});
	const result = rows[0];

	return result?.PublicIp;
};