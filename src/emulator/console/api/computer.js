const db = require('./db');
const mapClient = require('./map');
const parser = require('../parser/computer');

const get = async function(id) {
	const result = await db.client().get(`
		SELECT *
		FROM Computer
		WHERE ID = $0
	`, [id]);

	return {
		id: result.ID,
		isRouter: result.IsRouter,
		isPlayer: result.IsPlayer,
		isRented: result.IsRented,
		procs: result.Procs,
		date: result.Date,
		users: parser.parseUsers(result.Users),
		fileSystem: await parser.parseFileSystem(result.FileSystem),
		configOS: parser.parseConfigOS(result.ConfigOS),
		hardware: parser.parseHardware(result.Hardware)
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
			const configOS = parser.parseConfigOS(row.ConfigOS);
			return configOS.isPortAvailable(port);
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
		const configOS = parser.parseConfigOS(result.ConfigOS);

		if (configOS.hasPersonas()) {
			const map = await mapClient.getById(result.ID);
			const persona = configOS.getPersona(0);

			return {
				webAddress: map.webAddress,
				contact: {
					firstname: persona.getFirstname(),
					lastname: persona.getLastName()
				},
				mail: persona.getMail().getAddress(),
				phone: persona.getPhone()
			};
		}
	}
};

exports.get = get;
exports.getByIP = getByIP;
exports.getPersonaByIP = getPersonaByIP;