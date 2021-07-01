const computerClient = require('../api/computer');
const DefaultComputer = require('../../default/entities/computer');
const util = require('util');

const Computer = function(id, data) {
	DefaultComputer.call(this, id, data);
};

util.inherits(Computer, DefaultComputer);

Computer.load = async function(id) {
	const data = await computerClient.get(id);

	return new Computer(id, data);
};

module.exports = Computer;