const Port = require('./port');
const Service = require('./service');

const LanPC = function(data) {
	const me = this;

	me.camIndex = data.camIndex;
	me.computerId = data.computerID;
	me.gateway = data.gateway;
	me.isGateway = data.isGateway;
	me.isPlayer = data.isPlayer;
	me.isWifi = data.isWifi;
	me.libraryVersions = data.libVersions;
	me.localIP = data.localIp;
	me.playerAdding = data.playerAdding;
	me.ports = data.puertos.allPorts.map((item) => new Port(item));
	me.services = data.servicios.map((item) => new Service(item));
	me.typeDevice = data.typeDevice;
	me.website = data.website;

	return me;
};

module.exports = LanPC;