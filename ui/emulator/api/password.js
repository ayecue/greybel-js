const osPasswords = require('./fixtures/OSPasswords.json');
const passwords = require('./fixtures/Passwords.json');

exports.getOSPassword = function(id) {
	let password = '';

	try {
		const result = osPasswords.find((item) => item.ID === id);
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};

exports.getPassword = function(id) {
	let password = '';

	try {
		const result = passwords.find((item) => item.ID === id);
		password = result.PlainPassword;
	} catch (err) {
	}

	return password;
};