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

VM.prototype.createSession = async function(computerId) {
	const me = this;
	const computer = new Computer(computerId, me);

	await computer.start();
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

VM.prototype.start = async function() {
	const me = this;
	const p = await player.get();
	const session = await me.createSession(p.computerId);
	
	return await session.shell.start();
};

module.exports = VM;