const computers = require('./fixtures/Computer.json');
const mapClient = require('./map');
const parser = require('../parser/computer');

const get = function(id) {
	const result = computers.find((item) => item.ID === id);

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
	const results = computers
		.filter((row) => {
			const configOS = parser.parseConfigOS(row.ConfigOS);
			return configOS.isPortAvailable(port);
		});

	if (results.length === 1) {
		return results[0].ID;
	}
};

const getPersonaByIP = function(ip) {
	const result = computers.find((item) => {
		const configOS = JSON.parse(row.ConfigOS);

		return configOS.ipPublica === ip;
	});

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