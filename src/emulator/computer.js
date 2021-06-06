const computer = require('./api/computer');
const computerMetaTransformer = require('./transformer/computer-meta');

const Computer = function(id, vm) {
	const me = this;

	me.id = id;
	me.vm = vm;
	me.activeUser = null;
	me.users = null;
	me.fileSystem = null;
	me.configOS = null;
	me.Hardware = null;

	return me;
};

Computer.prototype.start = async function() {
	const me = this;
	
	await me.load();
	me.setActiveUser();
};

Computer.prototype.load = async function() {
	const me = this;
	const c = await computer.get(me.id);
	const meta = await computerMetaTransformer(c);

	me.users = meta.users;
	me.fileSystem = meta.fileSystem;
	me.configOS = meta.configOS;
	me.Hardware = meta.Hardware;
};

Computer.prototype.login = function(username, password) {
	const me = this;
	const user = me.users.find(function(item) {
		return item.username === username;
	});

	if (user && user.password === me.vm.tools.md5(password)) {
		me.activeUser = user;
		return true;
	}

	return false;
};

Computer.prototype.setActiveUser = function(username) {
	const me = this;
	if (username == null) username = me.users[me.users.length - 1].getName();

	me.activeUser = me.users.find((user) => {
		return user.getName() === username;
	});
};

Computer.prototype.getActiveUser = function() {
	return this.activeUser;
};

Computer.prototype.getHome = function() {
	const me = this;
	const name = me.activeUser ? me.activeUser.getName() : 'guest';

	if (name === 'root') {
		return ['', 'root'].join('/');
	}

	return ['', 'home', name].join('/');
};

module.exports = Computer;