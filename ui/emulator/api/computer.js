const computers = require('./fixtures/Computer.json');

exports.get = function(id) {
	const result = computers.find((item) => item.ID === id);

	return {
		users: JSON.parse(result.Users),
		fileSystem: JSON.parse(result.FileSystem),
		configOS: JSON.parse(result.ConfigOS),
		hardware: JSON.parse(result.Hardware)
	};
};