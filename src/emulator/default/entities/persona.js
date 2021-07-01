const BankUser = require('./bank-user');
const MailUser = require('./mail-user');

const Persona = function(data) {
	const me = this;

	me.id = data.ID;
	me.lastname = data.apellido;
	me.computerNetId = data.computerNetID;
	me.currentTraces = data.currentTraces; //not useful
	me.age = data.edad;
	me.schedule = data.horario;
	me.infoFace = data.infoFace; //not useful
	me.isAdmin = data.isAdmin;
	me.firstname = data.nombre;
	me.username = data.nombreUser;
	me.sex = data.sexo;
	me.stats = data.stats;
	me.phone = data.telefono;
	me.job = data.trabajo;
	me.bank = new BankUser(data.userBank);
	me.mail = new MailUser(data.userMail);

	return me;
};

Persona.prototype.getFirstname = function() {
	return this.firstname;
};

Persona.prototype.getLastname = function() {
	return this.lastname;
};

Persona.prototype.getMail = function() {
	return this.mail;
};

Persona.prototype.getPhone = function() {
	return this.phone;
};

module.exports = Persona;