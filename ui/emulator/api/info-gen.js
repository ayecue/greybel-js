const infoGen = require('./fixtures/InfoGen.json');

exports.get = function(id) {
	const result = infoGen[0];

	return {
		versionsControl: JSON.parse(result.VersionsControl),
		exploits: JSON.parse(result.Exploits)
	};
};