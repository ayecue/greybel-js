const build = require('../src/build');
const fs = require('fs');
const path = require('path');
const testFolder = path.resolve(__dirname, 'scripts');

jest.mock('node-color-log');

describe('build', function() {
	test('default scripts', function() {
		fs
			.readdirSync(testFolder)
			.forEach(file => {
				const filepath = path.resolve(testFolder, file);
				const output = build(filepath, null, {
					noWrite: true
				});

				expect(output).toMatchSnapshot();
			});
	});

	test('uglify scripts', function() {
		fs
			.readdirSync(testFolder)
			.forEach(file => {
				const filepath = path.resolve(testFolder, file);
				const output = build(filepath, null, {
					noWrite: true,
					uglify: true
				});

				expect(output).toMatchSnapshot();
			});
	});
});