const typer = require('../../cps-evaluator/typer');

module.exports = function(vm) {
	const api = {};

	api.get_shell = function(username, password) {
		const session = vm.getLastSession();

		if (username != null && password != null) {
			const success = session.computer.login(username, password);

			if (!success) {
				return null;
			}
		}

		const fileHandler = function(target) {
			const targetFile = session.computer.fileSystem.getByPath(target || '');

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

					fileInterface.set_content = function(content) {
						file.setContent(content);
					};
					fileInterface.has_permission = function(p) {
						console.log('has_permission is not yet supported');
						return typer.cast(true);
					};
					fileInterface.parent = function(p) {
						const parentPath = session.computer.fileSystem.resolve(file.getPath(), '..');
						return typer.cast(session.computer.fileSystem.getByPath(parentPath));
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
		};
		const computer = {
			File: fileHandler,
			show_procs: function() {
				console.log('delete is not yet supported');
				return typer.cast("");
			}
		};

		return typer.cast({
			host_computer: typer.cast(computer),
			start_terminal: function() {
				console.log('Method start_terminal is not supported.');
			}
		});
	};

	return api;
};