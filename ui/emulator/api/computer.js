const computers = require('./fixtures/Computer.json');

exports.get = function(id) {
	const result = computers.find((item) => item.ID === id);

	return {
		users: result.Users,
		fileSystem: result.FileSystem,
		configOS: result.ConfigOS,
		hardware: result.Hardware
	};
};