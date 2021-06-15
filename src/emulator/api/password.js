const db = require('./db');

exports.getOSPassword = async function(id) {
	let password = '';

	try {
		const result = await db().get(`
			SELECT PlainPassword
			FROM OSPasswords
			WHERE ID = $0
		`, [id]);
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};

exports.getPassword = async function(id) {
	let password = '';

	try {
		const result = await db().get(`
			SELECT PlainPassword
			FROM Passwords
			WHERE ID = $0
		`, [id]);
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};