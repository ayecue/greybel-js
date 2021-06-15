const player = require('./api/player');
const Shell = require('./shell');
const Computer = require('./computer');
const tools = require('./tools');

const VM = function() {
	const me = this;

	me.sessions = [];
	me.tools = tools;

	return me;
};

VM.prototype.createSession = function(computerId) {
	const me = this;
	const computer = new Computer(computerId, me);

	computer.start();
	me.computer = computer;

	const shell = new Shell(computer);

	const session = {
		computer: computer,
		shell: shell
	};

	me.sessions.push(session);

	return session;
};

VM.prototype.getLastSession = function() {
	const me = this;
	return me.sessions[me.sessions.length - 1];
};

VM.prototype.start = function(stdout, stdin) {
	const me = this;
	const p = player.get();
	const session = me.createSession(p.computerId);
	
	return session.shell.start(stdout, stdin);
};

module.exports = VM;