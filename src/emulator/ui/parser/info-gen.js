const entities = require('../entities');
const LibraryVersion = entities.LibraryVersion;
const Exploit = entities.Exploit;
const CurrentVersion = entities.CurrentVersion;
const parse = require('../../../utils/parse');

const parseExploits = function(exploitsData) {
	const result = [];

	for (libraryName in exploitsData) {
		const versions = exploitsData[libraryName];

		for (version in versions) {
			const exploits = versions[version];

			result.push(...exploits.map((exploitData) => new Exploit(libraryName, version, exploitData)));
		}
	}

	return result;
};

const parseVersionsControl = function(versionsControlData) {
	const result = [];

	for (libraryName in versionsControlData) {
		const libraryData = versionsControlData[libraryName];

		result.push(new LibraryVersion(libraryName, libraryData));
	}

	return result;
};

const parseCurrentVersions = function(currentVersionsData) {
	const result = [];

	for (libraryName in currentVersionsData) {
		const versionData = currentVersionsData[libraryName];

		result.push(new CurrentVersion(libraryName, versionData));
	}

	return result;
};

const parseClock = function(clockData) {
	return clockData;
};

exports.parseExploits = parse.JSON(parseExploits);
exports.parseVersionsControl = parse.JSON(parseVersionsControl);
exports.parseCurrentVersions = parse.JSON(parseCurrentVersions);
exports.parseClock = parse.JSON(parseClock);