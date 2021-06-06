const db = require('./db');

exports.get = async function(id) {
	const result = await db().get(`
		SELECT Users, FileSystem, ConfigOS, Hardware
		FROM Computer
		WHERE ID = $0
	`, [id]);

	return {
		users: result.Users,
		fileSystem: result.FileSystem,
		configOS: result.ConfigOS,
		hardware: result.Hardware
	};
};