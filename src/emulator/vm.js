const playerClient = require('./api/player');
const Shell = require('./shell');
const Computer = require('./computer');
const tools = require('./tools');

const VM = function() {
	const me = this;

	me.sessions = [];

	return me;
};

VM.prototype.createSession = async function(computerId) {
	const me = this;
	const computer = new Computer(computerId);

	await computer.start();

	const shell = new Shell(me, computer);

	me.sessions.push(shell);

	return shell;
};

VM.prototype.addSession = function(shell) {
	const me = this;
	me.sessions.push(shell);
	return me;
};

VM.prototype.removeLastSession = function() {
	const me = this;
	me.sessions.pop();
	return me;
};

VM.prototype.getLastSession = function() {
	const me = this;
	return me.sessions[me.sessions.length - 1];
};

VM.prototype.start = async function() {
	const me = this;
	const p = await playerClient.get();
	const shell = await me.createSession(p.computerId);
	
	return await shell.start();
};

module.exports = VM;