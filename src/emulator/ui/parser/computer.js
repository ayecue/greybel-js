const User = require('../../default/entities/user');
const Folder = require('../../default/entities/folder');
const ConfigOS = require('../../default/entities/config-os');
const Hardware = require('../../default/entities/hardware');
const File = require('..//entities/file');
const FileSystem = require('../../default/entities/file-system');
const fileClient = require('../api/file');
const resolve = FileSystem.prototype.resolve;
const parse = require('../../../utils/parse');

const sequence = function(items, callback) {
	return items.reduce(function(list, item) {
		list.push(callback(item));
		return list;
	}, []);
};

const parseFileSystem = function(fileSystemData) {
	const stack = [];
	const map = {};
	const next = function(item) {
		const isFolder = item.hasOwnProperty('files') && item.hasOwnProperty('folders');

		if (isFolder) {
			const folder = new Folder(item);
			const name = folder.getName();
			let path = resolve(stack.concat([name]).join('/')) || '/';

			folder.setPath(path);
			stack.push(name);

			const folders = sequence(item.folders, next);
			const files = sequence(item.files, next);

			folder.setFolders(folders);
			folder.setFiles(files);

			map[path] = folder;

			stack.pop();

			return folder;
		}

		const entity = new File(item);
		const path = resolve(stack.concat([entity.getName()]).join('/'));

		entity.load();

		entity.setPath(path);
		map[path] = entity;

		return entity;
	};
	const rootFolder = next(fileSystemData);

	return new FileSystem({
		map: map,
		rootFolder: rootFolder
	});
};

const parseUsers = function(userData) {
	return Object.values(userData).map((item) => new User(item));
};

const parseConfigOS = function(configOSData) {
	return new ConfigOS(configOSData);
};

const parseHardware = function(hardwareData) {
	return new Hardware(hardwareData);
};

exports.parseUsers = parse.JSON(parseUsers);
exports.parseConfigOS = parse.JSON(parseConfigOS);
exports.parseHardware = parse.JSON(parseHardware);
exports.parseFileSystem = parse.JSON(parseFileSystem);