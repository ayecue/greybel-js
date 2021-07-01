const fileClient = require('../api/file');
const DefaultFile = require('../../default/entities/file');
const util = require('util');

const File = function(data) {
	DefaultFile.call(this, data);
};

util.inherits(File, DefaultFile);

File.prototype.load = function() {
	const me = this;
	const content = fileClient.get(me.id);
	me.setContent(content);
	return me;
};

module.exports = File;