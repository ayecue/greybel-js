const computers = require('./fixtures/Computer.json');
const mapClient = require('./map');

const get = function(id) {
	const result = computers.find((item) => item.ID === id);

	return {
		users: JSON.parse(result.Users),
		fileSystem: JSON.parse(result.FileSystem),
		configOS: JSON.parse(result.ConfigOS),
		hardware: JSON.parse(result.Hardware)
	};
};

const getByIP = function(ip, port) {
	const isRouter = !port ? 1 : 0;
	const results = computers
		.filter((row) => {
			const configOS = JSON.parse(row.ConfigOS);
			const allPorts = configOS.puertos.allPorts;

			return 
				configOS.ipPublica === ip &&
				configOS.isRouter === isRouter &&
				allPorts.find((p) => p.externalPort === port && !p.isClosed && p.isVisible);
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
		const configOS = JSON.parse(result.ConfigOS);

		if (configOS?.personas?.length > 0) {
			const map = mapClient.getById(result.ID);
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