const stringArgv = require('string-argv').default;
const computerClient = require('./api/computer');
const scriptExecuter = require('./script-executer');
const api = require('./shell/api');
const tools = require('./tools');

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
	me.stdin = null;
	me.stdout = null;
	me.isPending = false;
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
	const me = this;
	me.stdout.clear();
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

Shell.prototype.connect = function(ip, port, username, password) {
	const me = this;
	const computerId = computerClient.getRemoteComputerId(ip, port);

	if (!computerId) return null;
	const computer = new Computer(computerId);
	computer.start();

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
	const me = this;
	const username = me.getUser().getName();
	const cwd = me.cwd();

	return `(${username}) ${cwd} -> `;
};

Shell.prototype.run = async function(content) {
	const me = this;
	const stdin = me.stdin;
	const stdout = me.stdout;

	if (me.isPending) {
		stdout.write('Another script is already in progress...');
		return;
	}

	stdin.clear();
	stdin.disable();
	
	me.isPending = true;

	await scriptExecuter({
		content: content,
		params: [],
		shell: me,
		stdout: me.stdout,
		stdin: me.stdin
	});

	me.isPending = false;
	stdout.write(me.getShellPrefix());

	stdin.enable();
	stdin.focus();

	return true;
};

Shell.prototype.echo = function(str, formatted) {
	const me = this;

	if (formatted) {
		me.stdout.write(str);
	} else {
		me.stdout.write(str);
	}
};

Shell.prototype.consume = async function(input) {
	const me = this;
	const activeUserName = me.getUser().getName();
	const fileSystem = me.computer.fileSystem;
	const cwd = me.cwd();
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

	if (file == null) return me.stdout.write('File not found.');

	if (file.isBinary) {
		return scriptExecuter({
			file: file,
			params: argv,
			shell: me,
			stdout: me.stdout,
			stdin: me.stdin
		});
	}

	me.stdout.write('File is not a binary.');
};

Shell.prototype.prompt = async function(question, isPassword) {
	const me = this;
	const stdin = me.stdin;
	const stdout = me.stdout;

	stdout.write(question);

	stdin.enable();
	stdin.focus();
	stdin.setType(isPassword ? 'password' : 'text');

	await stdin.waitForInput();

	const value = stdin.getValue();

	stdin.clear();
	stdin.disable();
	stdin.setType('text');

	return value;
};

Shell.prototype.start = function(stdout, stdin) {
	const me = this;
	const next = async function() {
		if (!me.exit) {
			stdout.write(me.getShellPrefix());

			stdin.enable();
			stdin.focus();

			me.isPending = false;

			await stdin.waitForInput();

			const value = stdin.getValue();

			stdin.clear();
			stdin.disable();

			stdout.write(me.getShellPrefix() + value);

			me.isPending = true;

			await me.consume(value);

			return next();
		}
	};

	me.stdin = stdin;
	me.stdout = stdout;

	return next();
};

module.exports = Shell;