const maps = require('./fixtures/Map.json');

exports.getById = function(id) {
	const result = maps.find((item) => item.ID === id);

	return {
		webAddress: result.WebAddress
	};
};