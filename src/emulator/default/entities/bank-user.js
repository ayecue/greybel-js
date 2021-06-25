const BankUser = function(data) {
	const me = this;

	me.user = data.user;
	me.password = data.password;
	me.passwordEncrypted = data.passwordEncrypt;
	me.serverNetId = data.serverNetID;

	return me;
};

module.exports = BankUser;