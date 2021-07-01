const MailUser = function(data) {
	const me = this;

	me.address = data.mailAdress;
	me.password = data.mailPassword;
	me.passwordEncrypted = data.encryptPassword;
	me.serverNetId = data.serverNetID;
	me.playerPcID = data.playerPcID;
	me.sent = data.enviados;
	me.received = data.recibidos;

	return me;
};

MailUser.prototype.getAddress = function() {
	return this.address;
};

module.exports = MailUser;