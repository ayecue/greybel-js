const dbClient = require('./db').client;

exports.getById = function(id) {
	const rows = dbClient.queryAll('maps', {
		query: {
			'ID': id
		},
		limit: 1
	});
	const result = rows[0];

	return {
		webAddress: result.WebAddress
	};
};