const dbClient = require('./db').client;

exports.get = function(id) {
	let content = '';

	try {
		const rows = dbClient.queryAll('files', {
			query: {
				'ID': id
			},
			limit: 1
		});
		const result = rows[0];
		content = result.Content;
	} catch (err) {
	}

	return content;
};