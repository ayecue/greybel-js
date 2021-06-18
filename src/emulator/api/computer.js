const db = require('./db');

const get = async function(id) {
	const result = await db.client().get(`
		SELECT Users, FileSystem, ConfigOS, Hardware
		FROM Computer
		WHERE ID = $0
	`, [id]);

	return {
		users: db.parseBlob(result.Users),
		fileSystem: db.parseBlob(result.FileSystem),
		configOS: db.parseBlob(result.ConfigOS),
		hardware: db.parseBlob(result.Hardware)
	};
};

const getByIP = async function(ip, port) {
	const results = await db.client()
		.all(`
			SELECT ID, ConfigOS, IsRouter
			FROM Computer
			WHERE 
				json_extract(ConfigOS, '$.ipPublica') LIKE $0 AND
				IsRouter != $1
		`, [ip, !port ? 1 : 0])
		.filter((row) => {
			const configOS = db.parseBlob(row.ConfigOS);
			const allPorts = configOS.puertos.allPorts;

			return allPorts.find((p) => p.externalPort === port && !p.isClosed && p.isVisible);
		});

	if (results.length === 1) {
		return results[0].ID;
	}
}

exports.get = get;
exports.getByIP = getByIP;