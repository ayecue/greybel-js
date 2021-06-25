const defaultEntities = require('../../default/entities');

module.exports = {
	...defaultEntities,
	File: require('./file')
};