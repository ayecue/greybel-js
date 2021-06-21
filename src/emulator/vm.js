const playerClient = require('./api/player');
const infoGenClient = require('./api/info-gen');
const Shell = require('./shell');
const Computer = require('./computer');
const ExploitManager = require('./exploit-manager');

const VM = function() {
	const me = this;

	me.sessions = [];
	me.clock = {
		game: {},
		start: Date.now()
	};
	me.infoGen = null;
	me.exploitManager = null;

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

VM.prototype.getTime = function() {
	const me = this;
	const clockGame = me.clock.game;
	const diff = Date.now() - me.start;
	const gameTime = new Date(`${clockGame.year}/${clockGame.mes}/${clockGame.dia} ${clockGame.hora}:${clockGame.minutos}`).getTime();

	return new Date(gameTime + diff);
};

VM.prototype.initClock = function() {
	const me = this;
	const newClock = {
		start: Date.now(),
		game: me.infoGen.clock
	};

	me.clock = newClock;
	return me;
};

VM.prototype.start = async function() {
	const me = this;
	const infoGen = await infoGenClient.get();

	me.infoGen = infoGen;
	me.exploitManager = new ExploitManager(infoGen);
	me.initClock();

	const p = await playerClient.get();
	const shell = await me.createSession(p.computerId);
	
	return await shell.start();
};

module.exports = VM;