const dbClient = require('./db').client;
const mapClient = require('./map');
const parser = require('../parser/computer');

const get = function(id) {
	const rows = dbClient
		.queryAll('computers', {
			query: {
				'ID': id
			},
			limit: 1
		});
	const result = rows[0];

	return {
		id: result.ID,
		isRouter: result.IsRouter,
		isPlayer: result.IsPlayer,
		isRented: result.IsRented,
		procs: parser.parseProcs(result.Procs),
		date: result.Date,
		users: parser.parseUsers(result.Users),
		fileSystem: parser.parseFileSystem(result.FileSystem),
		configOS: parser.parseConfigOS(result.ConfigOS),
		hardware: parser.parseHardware(result.Hardware)
	};
};

const getByIP = function(ip, port) {
	const isRouter = !port ? 1 : 0;
	const results = dbClient
		.queryAll('computers', {
			query: function(row) {
				const configOS = parser.parseConfigOS(row.ConfigOS);
				return configOS.isPortAvailable(port);
			}
		});

	if (results.length === 1) {
		return results[0].ID;
	}
};

const getPersonaByIP = function(ip) {
	const rows = dbClient
		.queryAll('computers', {
			query: function(row) {
				const configOS = JSON.parse(row.ConfigOS);
				return configOS.ipPublica === ip;
			},
			limit: 1
		});
	const result = rows[0];

	if (result) {
		const configOS = parser.parseConfigOS(result.ConfigOS);

		if (configOS.hasPersonas()) {
			const map = mapClient.getById(result.ID);
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