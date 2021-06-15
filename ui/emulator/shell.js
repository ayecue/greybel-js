const stringArgv = require('string-argv').default;
const scriptExecuter = require('./script-executer');
const api = require('./shell/api');

const DEFAULT_FOLDERS = [
	'/bin',
	'/usr/bin'
];

const Shell = function(computer) {
	const me = this;

	me.computer = computer;
	me.instance = null;
	me.exit = false;

	me.computer.fileSystem.set(me.computer.getHome());

	return me;
};

Shell.prototype.getShellPrefix = function() {
	return this.computer.fileSystem.cwd() + ' ->';
};

Shell.prototype.consume = function(inputMap) {
	const me = this;
	const activeUserName = me.computer.getActiveUser().getName();
	const fileSystem = me.computer.fileSystem;
	const cwd = me.computer.fileSystem.cwd();
	const input = inputMap[activeUserName];
	const argv = stringArgv(input);
	const target = argv.shift();
	const apiCommand = api(target);

	if (apiCommand) {
		return apiCommand.call(me, argv);
	}

	const folders = [cwd].concat(DEFAULT_FOLDERS);
	let file;

	for (let folder of folders) {
		const targetPath = fileSystem.resolve(folder, target);
		const foundFile = fileSystem.getByPath(targetPath);

		if (foundFile != null) {
			file = foundFile;
			break;
		}
	}

	if (file == null) return console.log('File not found.');

	if (file.isBinary) {
		return scriptExecuter({
			file: file,
			params: argv,
			vm: me.computer.vm
		});
	}

	console.log('File is not a binary.')
};

Shell.prototype.prompt = async function(question, isPassword) {
	const me = this;
	const activeUserName = me.computer.getActiveUser().getName();
	const name = [activeUserName, 'prompt'].join('-');

	return /*inquirer
		.prompt({
			prefix: chalk.green.bold('(' + activeUserName + ')'),
			name: name,
			message: question,
			type: isPassword ? 'password' : 'input',
			loop: true
		})
		.then(function(inputMap) {
			return inputMap[name];
		})
		.catch((err) => {
			throw err;
		});*/
};

Shell.prototype.start = function() {
	const me = this;
	const next = function() {
		if (!me.exit) {
			const activeUserName = me.computer.getActiveUser().getName();

			return /*inquirer
				.prompt({
					type: 'command',
					prefix: chalk.green.bold('(' + activeUserName + ')'),
					name: activeUserName,
					message: me.getShellPrefix(),
					type: 'input'
				})
				.then(me.consume.bind(me))
				.then(next)
				.catch((err) => {
					console.error(err);
					next();
				});*/
		}
	}

	return next();
};

module.exports = Shell;