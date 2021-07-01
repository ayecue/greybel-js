const User = require('../../default/entities/user');
const Folder = require('../../default/entities/folder');
const ConfigOS = require('../../default/entities/config-os');
const Hardware = require('../../default/entities/hardware');
const File = require('..//entities/file');
const FileSystem = require('../../default/entities/file-system');
const Process = require('../../default/entities/process');
const fileClient = require('../api/file');
const resolve = FileSystem.prototype.resolve;
const parse = require('../../../utils/parse');

const sequence = function(items, callback) {
	return items.reduce(function(prev, item) {
		return prev.then(function(list) {
			return callback(item).then(function(x) {
				list.push(x);
				return list;
			});
		});
	}, Promise.resolve([]));
};

const parseFileSystem = async function(fileSystemData) {
	const stack = [];
	const map = {};
	const next = async function(item) {
		const isFolder = item.hasOwnProperty('files') && item.hasOwnProperty('folders');

		if (isFolder) {
			const folder = new Folder(item);
			const name = folder.getName();
			let path = resolve(stack.concat([name]).join('/')) || '/';

			folder.setPath(path);
			stack.push(name);

			const folders = await sequence(item.folders, next);
			const files = await sequence(item.files, next);

			folder.setFolders(folders);
			folder.setFiles(files);

			map[path] = folder;

			stack.pop();

			return folder;
		}

		const entity = new File(item);
		const path = resolve(stack.concat([entity.getName()]).join('/'));

		await entity.load();

		entity.setPath(path);
		map[path] = entity;

		return entity;
	};
	const rootFolder = await next(fileSystemData);

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

const parseProcs = function(procsData) {
	return procsData.map((item) => new Process(procsData));
};

exports.parseProcs = parse.JSON(parseProcs);
exports.parseUsers = parse.JSON(parseUsers);
exports.parseConfigOS = parse.JSON(parseConfigOS);
exports.parseHardware = parse.JSON(parseHardware);
exports.parseFileSystem = parse.JSON(parseFileSystem);