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
	me.stdin = null;
	me.stdout = null;
	me.history = [];

	me.computer.fileSystem.set(me.computer.getHome());

	return me;
};

Shell.prototype.getShellPrefix = function() {
	return this.computer.fileSystem.cwd() + ' ->';
};

Shell.prototype.run = async function(content) {
	const me = this;

	return scriptExecuter({
		content: content,
		params: [],
		vm: me.computer.vm
	});
};

Shell.prototype.consume = async function(input) {
	const me = this;
	const activeUserName = me.computer.getActiveUser().getName();
	const fileSystem = me.computer.fileSystem;
	const cwd = me.computer.fileSystem.cwd();
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

	console.log('File is not a binary.');
};

Shell.prototype.prompt = function(question, isPassword) {
	const me = this;
	const activeUserName = me.computer.getActiveUser().getName();
	const name = [activeUserName, 'prompt'].join('-');

	throw new Error('Not supported yet');
};

Shell.prototype.start = function(stdout, stdin) {
	const me = this;
	const next = function() {
		if (!me.exit) {
			const activeUserName = me.computer.getActiveUser().getName();

			me.history.push(me.getShellPrefix());
			stdout.value = me.history.join('\n');
			stdin.disabled = false;

			return new Promise((resolve, reject) => {
				const handler = (evt) => {
					if (evt.keyCode == 13) {
						const value = stdin.value;

						stdin.value = '';
						stdin.disabled = true;
						stdin.removeEventListener('keydown', handler);

						me.consume(value).then(next, reject);
					}
				};

				stdin.addEventListener('keydown', handler);
			});
		}
	}

	me.stdin = stdin;
	me.stdout = stdout;

	return next();
};

module.exports = Shell;