const User = require('../entities/user');
const Folder = require('../entities/folder');
const File = require('../entities/file');
const FileSystem = require('../file-system');
const fileClient = require('../api/file');
const resolve = FileSystem.prototype.resolve;

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

	return {
		map: map,
		rootFolder: rootFolder
	};
};

module.exports = function(data) {
	return {
		users: Object.values(data.users).map((item) => new User(item)),
		fileSystem: new FileSystem(parseFileSystem(data.fileSystem)),
		configOS: data.configOS,
		Hardware: data.Hardware
	};
};