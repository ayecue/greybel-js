const Port = function(data) {
	const me = this;

	me.id = data.ID;
	me.externalPort = data.externalPort;
	me.internalPort = data.internalPort;
	me.isClosed = data.isClosed;
	me.isProtected = data.isProtected;
	me.isVisible = data.isVisible;
	me.lanIP = data.lanIP;

	return me;
};

Port.prototype.isAvailable = function() {
	const me = this;

	return !me.isClosed && me.isVisible;
};

Port.prototype.getExternalPort = function() {
	return this.externalPort;
};

module.exports = Port;