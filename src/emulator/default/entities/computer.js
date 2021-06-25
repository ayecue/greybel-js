const md5 = require('../../../utils/md5');
const Process = require('./process');

const Computer = function(id, data) {
	const me = this;

	me.id = id;
	me.isRouter = data.isRouter;
	me.isPlayer = data.isPlayer;
	me.isRented = data.isRented;
	me.procs = data.procs;
	me.date = data.date;
	me.users = data.users;
	me.fileSystem = data.fileSystem;
	me.configOS = data.configOS;
	me.hardware = data.hardware;

	return me;
};

Computer.prototype.login = function(username, password) {
	const me = this;
	const user = me.users.find(function(item) {
		return item.username === username;
	});

	if (user && user.password === md5(password)) {
		return user;
	}
};

Computer.prototype.getDefaultUser = function() {
	const me = this;
	
	return me.users[me.users.length - 1];
};

Computer.prototype.getHome = function(username) {
	const me = this;
	const name = username ? username : 'guest';

	if (name === 'root') {
		return ['', 'root'].join('/');
	}

	return ['', 'home', name].join('/');
};

module.exports = Computer;