const fileClient = require('../api/file');
const DefaultFile = require('../../default/entities').File;
const util = require('util');

const File = function(data) {
	DefaultFile.call(this, data);
};

util.inherits(File, DefaultFile);

File.prototype.load = async function() {
	const me = this;
	const content = await fileClient.get(me.id);

	me.setContent(content);
	return me;
};

module.exports = File;