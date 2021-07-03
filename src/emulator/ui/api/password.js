const dbClient = require('./db').client;

exports.getOSPassword = function(id) {
	let password = '';

	try {
		const rows = dbClient.queryAll('osPasswords', {
			query: {
				'ID': id
			},
			limit: 1
		});
		const result = rows[0];
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};

exports.getPassword = function(id) {
	let password = '';

	try {
		const rows = dbClient.queryAll('passwords', {
			query: {
				'ID': id
			},
			limit: 1
		});
		const result = rows[0];
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};