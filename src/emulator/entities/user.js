const User = function(data) {
	const me = this;

	me.username = data.nombreUsuario;
	me.password = data.password;
	me.groups = data.grupos;

	return me;
};

User.prototype.getName = function() {
	return this.username;
};

module.exports = User;