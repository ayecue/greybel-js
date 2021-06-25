const Service = function(data) {
	const me = this;

	me.isClosed = data.isClosed;
	me.name = data.nombre;
	me.configName = data.nomdb;
	me.exeName = data.nomexe;
	me.configPath = data.pathDb;
	me.exePath = data.pathExe;
	me.probability = data.probabilidad;
	me.port = data.puerto;

	return me;
};

module.exports = Service;