var get_shell = (function() {
	const vm = $VM_INSTANCE;

	return function(username, password) {
		const session = vm.getLastSession();

		if (username != null && password != null) {
			const success = session.computer.login(username, password);

			if (!success) {
				return null;
			}
		}

		const fileHandler = function(target) {
			const file = session.computer.fileSystem.getByPath(target || '');

			if (file) {
				const fileInterface = {};
				const attributeMap = {
					'get_content': 'content',
					'get_files': 'files',
					'get_folders': 'folders',
					'group': 'group',
					'path': 'path',
					'is_binary': 'isBinary',
					'is_folder': 'isFolder',
					'owner': 'owner',
					'permissions': 'permissions',
					'size': 'size'
				};

				fileInterface.set_content = function(content) {
					file.setContent(content);
				};
				fileInterface.has_permission = function(p) {
					console.log('has_permission is not yet supported');
					return true;
				};

				Object.defineProperty(fileInterface, 'parent', {
					get: function() {
						const parentPath = session.computer.fileSystem.resolve(file.getPath(), '..');
						return session.computer.fileSystem.getByPath(parentPath);
					}
				});

				Object.defineProperty(fileInterface, 'delete', {
					get: function() {
						console.log('delete is not yet supported');
					}
				});

				Object.entries(attributeMap).forEach(function([key, attribute]) {
					Object.defineProperty(fileInterface, key, {
						get: function() {
							let result = file.getAttribute(attribute);
							if (Array.isArray(result)) result = CustomList(...result);
							else if (typeof result === 'object') result = CustomMap(result);
							return result;
						}
					});
				});

				return fileInterface;
			}
		};
		const computer = {
			File: fileHandler
		};

		return {
			host_computer: computer,
			start_terminal: function() {
				console.log('Method start_terminal is not supported.');
			}
		};
	};
})();