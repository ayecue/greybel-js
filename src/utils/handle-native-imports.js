const path = require('path');
const logger = require('node-color-log');

module.exports = function(filePath, nativeImports, Builder, outputDir, buildOptions) {
	const outputBuilder = [];

	nativeImports.forEach(function(nativeImport) {
		if (buildOptions.noWrite) {
			logger.warn('WARNING: Ignoring ' + filePath + ' since there is not output.');
			return;
		}

		const originalDirname = path.dirname(filePath);

		const importFilePathRelative = path.resolve(originalDirname, nativeImport);
		const originalOutputDirname = path.dirname(outputDir);
		const relativeOutputTarget = path.dirname(nativeImport);
		const outputFilePathRelative = path.resolve(originalOutputDirname, relativeOutputTarget);

		const builder = new Builder(importFilePathRelative, outputFilePathRelative, null, true);
		
		builder.parse(buildOptions);

		outputBuilder.push(builder);
	});

	return outputBuilder;
};
