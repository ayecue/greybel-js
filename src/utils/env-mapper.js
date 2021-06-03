const fs = require('fs');
const path = require('path');

const readVarLines = function(varLines, map) {
	if (map == null) map = {};

	let line;
	
	for (line of varLines) {
		line = line.trim();
		if (line == '' || line[0] == '#') continue;
		const def = line.split('=');
		const name = def.shift().trim();
		const value = def.shift().trim();
		map[name] = value;
	}
	
	return map;
};

const loadConfigFile = function(filepath, map) {
	filepath = path.resolve(filepath);

	if (!fs.existsSync(filepath)) {
		throw new Error('No file: ' + filepath);
	}

	const content = fs.readFileSync(filepath, {
		encoding: 'utf-8'
	});
	
	return readVarLines(content.split('\n'), map);
};

const EnvironmentVariables = function() {
	const me = this;
	me.map = {};
	return me;
};

EnvironmentVariables.prototype.load = function(envFiles, envVars) {
	const me = this;

	if (envFiles) {
		let file;
		for (file of envFiles) {
			me.map = loadConfigFile(file, me.map)
		}
	}
	
	if (envVars) me.map = readVarLines(envVars, me.map);

	return me.map;
};

EnvironmentVariables.prototype.get = function(key) {
	const me = this;
	const varExists = key in me.map;
	if (varExists) return me.map[key];
	return null;
};

module.exports = EnvironmentVariables;