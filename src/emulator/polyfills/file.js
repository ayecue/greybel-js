const typer = require('../../cps-evaluator/typer');

module.exports = function(shell, target) {
	const targetFile = shell.getByPath(target || '');

	if (targetFile) {
		const createInterface = function(file) {
			const fileInterface = {};
			const attributeMap = {
				'get_content': 'content',
				'group': 'group',
				'path': 'path',
				'is_binary': 'isBinary',
				'is_folder': 'isFolder',
				'owner': 'owner',
				'permissions': 'permissions',
				'size': 'size',
				'name': 'name'
			};

			fileInterface.__isa = 'file';
			fileInterface.set_content = function(content) {
				file.setContent(content);
			};
			fileInterface.has_permission = function(p) {
				console.log('has_permission is not yet supported');
				return typer.cast(true);
			};
			fileInterface.parent = function(p) {
				return typer.cast(shell.getByPath('..'));
			};
			fileInterface.delete = function() {
				console.log('delete is not yet supported');
			};
			fileInterface.get_folders = function() {
				const folders = file.getAttribute('folders');
				return typer.cast(folders.map(createInterface));
			};
			fileInterface.get_files = function() {
				const files = file.getAttribute('files');
				return typer.cast(files.map(createInterface));
			};

			Object.entries(attributeMap).forEach(function([key, attribute]) {
				fileInterface[key] = function() {
					let result = file.getAttribute(attribute);
					return typer.cast(result); 
				};
			});

			return typer.cast(fileInterface);
		};

		return createInterface(targetFile);
	}

	return typer.cast(null);
};