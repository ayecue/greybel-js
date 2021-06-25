const playerClient = require('./api/player');
const infoGenClient = require('./api/info-gen');
const Shell = require('./shell');
const Computer = require('./entities/computer');

const VM = function() {
	const me = this;

	me.sessions = [];
	me.clock = {
		game: {},
		start: Date.now()
	};
	me.infoGen = null;

	return me;
};

VM.prototype.createSession = function(computerId) {
	const me = this;
	const computer = Computer.load(computerId);
	const shell = new Shell(me, computer);

	console.log(shell);

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
	const diff = Date.now() - me.clock.start;
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

VM.prototype.start = function(stdout, stdin) {
	const me = this;
	const infoGen = infoGenClient.get();

	me.infoGen = infoGen;
	me.initClock();

	console.log(infoGen);

	const p = playerClient.get();
	const shell = me.createSession(p.computerId);
	
	return shell.start(stdout, stdin);
};

module.exports = VM;