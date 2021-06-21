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

const headerContent = fs.readFileSync(headerFilepath, 'utf8');
const moduleContent = fs.readFileSync(moduleFilepath, 'utf8');
const mainContent = fs.readFileSync(mainFilepath, 'utf8');

exports.HEADER_BOILERPLATE = transform(headerContent);
exports.MODULE_BOILERPLATE = transform(moduleContent);
exports.MAIN_BOILERPLATE = transform(mainContent);