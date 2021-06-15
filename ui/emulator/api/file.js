const files = require('./fixtures/Files.json');

exports.get = function(id) {
	let content = '';

	try {
		const result = files.find((item) => item.ID === id);
		content = result.Content;
	} catch (err) {
	}

	return content;
};