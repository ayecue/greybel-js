const infoGen = require('./fixtures/InfoGen.json');

exports.get = async function(id) {
	const result = infoGen[0];

	return {
		versionsControl: result.VersionsControl,
		exploits: result.Exploits
	};
};