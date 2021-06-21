const User = function(data) {
	const me = this;

	me.username = data.nombreUsuario;
	me.password = data.password;
	me.plainPassword = data.passPlano;
	me.groups = data.grupos;

	return me;
};

User.prototype.getName = function() {
	return this.username;
};

User.prototype.getPlainPassword = function() {
	return this.plainPassword;
};

module.exports = User;