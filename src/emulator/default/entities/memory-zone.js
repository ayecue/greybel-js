const Vulnerability = require('./vulnerability');

const MemoryZone = function(address, data) {
	const me = this;

	me.address = address;
	me.hide = data.hide;
	me.timesPatched = data.timesPatched;
	me.vulnerabilities = data.vulnerabs.map((item) => new Vulnerability(item));

	return me;
};

module.exports = MemoryZone;