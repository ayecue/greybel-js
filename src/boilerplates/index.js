const Parser = require('../parser');
const fs = require('fs');
const path = require('path');

const headerFilepath = path.resolve(__dirname, 'header.src');
const moduleFilepath = path.resolve(__dirname, 'module.src');
const mainFilepath = path.resolve(__dirname, 'main.src');

const transform = function(content) {
	const parser = new Parser(content);
	return parser.parseChunk();
};

exports.HEADER_BOILERPLATE = transform(fs.readFileSync(headerFilepath, {
	encoding: 'utf-8'
}));
exports.MODULE_BOILERPLATE = transform(fs.readFileSync(moduleFilepath, {
	encoding: 'utf-8'
}));
exports.MAIN_BOILERPLATE = transform(fs.readFileSync(mainFilepath, {
	encoding: 'utf-8'
}));