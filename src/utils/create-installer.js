const fs = require('fs');
const path = require('path');
const logger = require('node-color-log');

function createContentHeader() {
	return [
		's = get_shell',
		'c = s.host_computer',
		'h = home_dir'
	].join('\n');
}

function isRootDirectory(target) {
	return /^(\.|\/)$/.test(target);
}

function createFolderLine(folder) {
	const parent = path.dirname(folder);
	const target = path.basename(folder);
	let output = [];

	if (isRootDirectory(target)) {
		return output;
	}

	if (isRootDirectory(parent)) {
		output = output.concat([
			'folder = c.File(h + "/' + target + '")',
			'if (folder == null) then c.create_folder(h, "/' + target + '")'
		]);
	} else {
		output = output.concat([
			'folder = c.File(h + "' + parent + '/' + target + '")',
			'if (folder == null) then c.create_folder(h + "' + parent + '", "/' + target + '")'
		]);
	}

	return output;
}

function createFileLine(file, isNew) {
	const base = path.basename(file);
	const folder = path.dirname(file);
	let output = createFolderLine(folder);

	if (isNew) {
		if (isRootDirectory(folder)) {
			output = output.concat([
				'print("Creating " + h + "/' + base + '")',
				'c.touch(h, "' + base + '")',
				'file = c.File(h + "/' + base + '")',
				'lines = []'
			]);
		} else {
			output = output.concat([
				'print("Creating " + h + "' + folder + '/' + base + '")',
				'c.touch(h + "' + folder + '", "' + base + '")',
				'file = c.File(h + "' + folder + '/' + base + '")',
				'lines = []'
			]);
		}
	} else {
		if (isRootDirectory(folder)) {
			output = output.concat([
				'file = c.File(h + "/' + base + '")',
				'if (file == null) then',
				'c.touch(h, "' + base + '")',
				'file = c.File(h + "/' + base + '")',
				'end if',
				'lines = file.get_content.split(char(10))'
			]);
		} else {
			output = output.concat([
				'file = c.File(h + "' + folder + '/' + base + '")',
				'if (file == null) then',
				'c.touch(h + "' + folder + '", "' + base + '")',
				'file = c.File(h + "' + folder + '/' + base + '")',
				'end if',
				'lines = file.get_content.split(char(10))'
			]);
		}
	}

	return output.join('\n');
}

function createCodeInsertLine(line) {
	const parsed = line
		.replace(/"/g, '""')
		.replace(/^import_code\(/i, 'import" + "_" + "code(');

	return 'lines.push("' + parsed + '")';
}

function createSetContentLine() {
	return 'file.set_content(lines.join(char(10)))';
}

function createImportList(builder) {
	const pseudoRoot = path.dirname(builder.filepath);
	const list = [{
		filepath: builder.output,
		pseudoFilepath: path.basename(builder.filepath),
		content: fs.readFileSync(builder.output, 'utf-8')
	}];
	const imports = builder.nativeImportBuilders.map(function(item) {
		return {
			filepath: item.output,
			pseudoFilepath: item.filepath
				.replace(pseudoRoot, '')
				.replace(path.sep, '/'),
			content: fs.readFileSync(item.output, 'utf-8')
		};
	});

	return list.concat(imports);
}

module.exports = function(builder, maxWords) {
	const targetDirectory = path.dirname(builder.output);
	const importList = createImportList(builder);
	const maxWordsWithBuffer = maxWords - 1000;
	let installerSplits = 0;
	let content = createContentHeader();
	let item = importList.shift();
	const createInstallerFile = function() {
		if (content.length === 0) {
			return;
		}

		fs.writeFileSync(path.resolve(targetDirectory, 'installer' + installerSplits + '.src'), content, {
			encoding: 'utf-8'
		});
		installerSplits++;
	};
	const openFile = function(file) {
		const preparedLine = '\n' + createFileLine(file, true);
		const newContent = content + preparedLine;

		if (newContent.length > maxWordsWithBuffer) {
			createInstallerFile();
			content = createContentHeader() + '\n' + createFileLine(file, true);
		} else {
			content = newContent;
		}
	};
	const addLine = function(file, line) {
		const preparedLine = '\n' + createCodeInsertLine(line);
		const newContent = content + preparedLine;

		if (newContent.length > maxWordsWithBuffer) {
			content += '\n' + createSetContentLine();
			createInstallerFile();
			content = createContentHeader() + '\n' + createFileLine(file);
			addLine(file, line);
		} else {
			content = newContent;
		}
	};

	while (item) {
		const lines = item.content.split("\n");
		let line = lines.shift();

		openFile(item.pseudoFilepath);

		while (line) {
			addLine(item.pseudoFilepath, line);
			line = lines.shift();
		}

		content += '\n' + createSetContentLine();

		item = importList.shift();
	}

	createInstallerFile();
};
