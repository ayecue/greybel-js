const HACK_RESULTS = {
	SHELL: 0,
	RANDOM_FOLDER: 1,
	CHANGE_PASSWORD: 2,
	COMPUTER: 3,
	FIREWALL_DISABLE: 4
};

const HelperHackResult = function(data) {
	const me = this;

	me.hackResult = data.hackResult;
	me.numConnGateways = data.numConnGateway;
	me.numPortForwards = data.numPortForward;
	me.numRegisteredUsers = data.numRegisterUsers;
	me.randomPath = data.randomPath;
	me.user = data.user;
	me.used = data.vecesUsado;

	return me;
};

HelperHackResult.prototype.isShell = function() {
	return HACK_RESULTS.SHELL === this.hackResult;
};

HelperHackResult.prototype.isRandomFolder = function() {
	return HACK_RESULTS.RANDOM_FOLDER === this.hackResult;
};

HelperHackResult.prototype.isChangePassword = function() {
	return HACK_RESULTS.CHANGE_PASSWORD === this.hackResult;
};

HelperHackResult.prototype.isComputer = function() {
	return HACK_RESULTS.COMPUTER === this.hackResult;
};

HelperHackResult.prototype.isFirewallDisable = function() {
	return HACK_RESULTS.FIREWALL_DISABLE === this.hackResult;
};

module.exports = HelperHackResult;