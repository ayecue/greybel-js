const inquirer = require('inquirer');
inquirer.registerPrompt('command', require('inquirer-command-prompt'));
const stringArgv = require('string-argv').default;
const chalk = require('chalk');
const scriptExecuter = require('./script-executer');
const api = require('./shell/api');
const computerClient = require('./api/computer');
const logger = require('node-color-log');
const tools = require('./tools');
const Computer = require('./computer');

const DEFAULT_FOLDERS = [
	'/bin',
	'/usr/bin'
];

const Shell = function(vm, computer, user) {
	const me = this;

	me.vm = vm;
	me.computer = computer;
	me.user = user || computer.getDefaultUser();
	me.path = me.getHome();
	me.exit = false;
	me.tools = tools;

	return me;
};

Shell.prototype.fork = function(username, password) {
	const me = this;

	if (username != null && password != null) {
		const user = me.computer.login(username, password);

		if (user == null) return;

		return new Shell(me.vm, me.computer, user);
	}

	return me;
};

Shell.prototype.clear = function() {
	console.clear();
};

Shell.prototype.getHome = function() {
	const me = this;
	return me.computer.getHome(me.user.getName());
};

Shell.prototype.attach = function() {
	const me = this;
	me.vm.addSession(me);
	return me;
};

Shell.prototype.connect = async function(ip, port, username, password) {
	const me = this;
	const computerId = await computerClient.getRemoteComputerId(ip, port);

	if (!computerId) return null;
	const computer = new Computer(computerId);
	await computer.start();

	const user = computer.login(username, password);
	if (!user) return null;

	const shell = new Shell(me.vm, computer, user);

	return shell;
};

Shell.prototype.setPath = function(target) {
	const me = this;
	const fileSystem = me.computer.fileSystem;
	if (!fileSystem.exists(target)) {
		console.error(`Path ${target} does not exist.`);
		return me;
	}
	me.path = target;
	return me;
};

Shell.prototype.getByPath = function(target) {
	const me = this;
	const fileSystem = me.computer.fileSystem;
	target = fileSystem.resolve(me.cwd(), target);
	return fileSystem.get(target);
};

Shell.prototype.getUser = function() {
	return this.user;
};

Shell.prototype.cwd = function() {
	return this.path;
};

Shell.prototype.cd = function(target) {
	const me = this;
	const newPath = me.computer.fileSystem.resolve(me.cwd(), target) || '/';
	me.setPath(newPath);
	return me;
};

Shell.prototype.getShellPrefix = function() {
	return this.cwd() + ' ->';
};

Shell.prototype.echo = function(str, formatted) {
	if (formatted) {
		console.table(str.split('\\n'));
	} else {
		console.log(str.split('\\n').join('\n'));
	}
};

Shell.prototype.consume = function(inputMap) {
	const me = this;
	const activeUserName = me.getUser().getName();
	const fileSystem = me.computer.fileSystem;
	const cwd = me.cwd();
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
		const foundFile = me.getByPath(targetPath);

		if (foundFile != null) {
			file = foundFile;
			break;
		}
	}

	if (file == null) return logger.warn('File not found.');

	if (file.isBinary) {
		return scriptExecuter({
			file: file,
			params: argv,
			shell: me
		});
	}

	logger.warn('File is not a binary.')
};

Shell.prototype.prompt = function(question, isPassword) {
	const me = this;
	const activeUserName = me.getUser().getName();
	const name = [activeUserName, 'prompt'].join('-');

	return inquirer
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
		});
};

Shell.prototype.start = function() {
	const me = this;
	const next = function() {
		if (!me.exit) {
			const activeUserName = me.getUser().getName();

			return inquirer
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
					return next();
				});
		}
	}

	chalk.enabled = true;
	chalk.level = 3;

	return next();
};

module.exports = Shell;