const build = require('../src/build-light');
const fs = require('fs');
const path = require('path');
const testFolder = path.resolve(__dirname, 'scripts');

describe('build-light', function() {
	test('default scripts', function() {
		fs
			.readdirSync(testFolder)
			.forEach(file => {
				const filepath = path.resolve(testFolder, file);
				const code = fs.readFileSync(filepath, {
					encoding: 'utf-8'
				});
				const output = build({
					content: code
				});

				expect(output).toMatchSnapshot();
			});
	});

	test('uglify scripts', function() {
		fs
			.readdirSync(testFolder)
			.forEach(file => {
				const filepath = path.resolve(testFolder, file);
				const code = fs.readFileSync(filepath, {
					encoding: 'utf-8'
				});
				const output = build({
					content: code,
					uglify: true
				});

				expect(output).toMatchSnapshot();
			});
	});
});