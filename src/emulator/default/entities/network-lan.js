const RouterDevice = require('./router-device');

const NetworkLan = function(data) {
	const me = this;

	me.clientId = data.clientID;
	me.playerOwnerID = data.playerOwnerID;
	me.publicIP = data.publicIP;
	me.routerDevice = data.routerDevice ? new RouterDevice(data.routerDevice) : data.routerDevice;
	me.seed = data.seed;
	me.typePlace = data.typePlace;

	return me;
};

module.exports = NetworkLan;