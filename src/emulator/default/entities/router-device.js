const LanPC = require('./lan-pc');

const RouterDevice = function(data) {
	const me = this;

	me.id = data.ID;
	me.bssid = data.bssid;
	me.essid = data.essid;
	me.firewallRules = data.firewallRules; //needs object
	me.hubs = data.hubs; //needs object
	me.lanPCs = data.lanPcInfos.map((item) => new LanPC(item));
	me.localIP = data.localIp;
	me.isSwitch = data.m_isSwitch;
	me.playerAdding = data.playerAdding;
	me.privateGateway = data.privateGateway;
	me.routers = data.routers; //needs object
	me.wifiEnabled = data.wifiEnabled;

	return me;
};

module.exports = RouterDevice;