const db = require('./db');
const mapClient = require('./map');

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
};

const getPersonaByIP = async function(ip) {
	const result = await db.client().get(`
		SELECT ID, ConfigOS
		FROM Computer
		WHERE json_extract(ConfigOS, '$.ipPublica') LIKE $0
	`, [ip]);

	if (result) {
		const configOS = db.parseBlob(result.ConfigOS);

		if (configOS?.personas?.length > 0) {
			const map = await mapClient.getById(result.ID);
			const persona = configOS.personas[0];

			return {
				webAddress: map.webAddress,
				contact: {
					firstname: persona.nombre,
					lastname: persona.apellido
				},
				mail: persona.userMail.mailAdress,
				phone: persona.telefono
			};
		}
	}
};

exports.get = get;
exports.getByIP = getByIP;
exports.getPersonaByIP = getPersonaByIP;