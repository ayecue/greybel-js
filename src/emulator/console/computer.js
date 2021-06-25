const computerClient = require('./api/computer');
const tools = require('./tools');

const Computer = function(id) {
	const me = this;

	me.id = id;
	me.users = null;
	me.fileSystem = null;
	me.configOS = null;
	me.hardware = null;

	return me;
};

Computer.prototype.start = async function() {
	const me = this;
	
	await me.load();
};

Computer.prototype.load = async function() {
	const me = this;
	const data = await computerClient.get(me.id);

	me.users = data.users;
	me.fileSystem = data.fileSystem;
	me.configOS = data.configOS;
	me.hardware = data.hardware;
};

Computer.prototype.login = function(username, password) {
	const me = this;
	const user = me.users.find(function(item) {
		return item.username === username;
	});

	if (user && user.password === tools.md5(password)) {
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