const Hardware = function(data) {
	const me = this;

	me.cpus = data.cpus;
	me.harddisk = data.hardDisk;
	me.motherboard = data.motherBoard;
	me.networkDevices = data.networkDevices;
	me.powerSupply = data.powerSupply;
	me.rams = data.rams;

	return me;
};

module.exports = Hardware;