const infoGen = require('./fixtures/InfoGen.json');
const parser = require('../parser/info-gen');

exports.get = function(id) {
	const result = infoGen[0];

	return {
		currentVersions: parser.parseCurrentVersions(result.CurrentVersions),
		versionsControl: parser.parseVersionsControl(result.VersionsControl),
		exploits: parser.parseExploits(result.Exploits),
		clock: parser.parseClock(result.Clock)
	};
};