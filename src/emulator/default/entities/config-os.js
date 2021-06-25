const Port = require('./port');
const NetworkLan = require('./network-lan');
const Persona = require('./persona');
const Service = require('./service');

const ConfigOS = function(data) {
	const me = this;

	me.activeNetCard = data.activeNetCard;
	me.backupFirewall = data.backupFirewall;
	me.backupPassRootRented = data.backupPassRootRented;
	me.backupPorts = data.backupPorts;
	me.backupRented = data.backupRented;
	me.localIP = data.ipLocal;
	me.publicIP = data.ipPublica;
	me.originalPublicIP = data.origIpPublica;
	me.isRented = data.isRented;
	me.missionAccount = data.missionAccount;
	me.networkLan = data.networkLan ? new NetworkLan(data.networkLan) : data.networkLan;
	me.payments = data.payments; //not useful
	me.pcName = data.pcName;
	me.personas = data.personas.map((item) => new Persona(item));
	me.ports = data.puertos.allPorts.map((item) => new Port(item));
	me.reverseShells = data.reverseShells; //implemented later
	me.savedNetworks = data.savedNetworks; //not useful
	me.services = data.servicios.map((item) => new Service(item));

	return me;
};

ConfigOS.prototype.isPortAvailable = function(port) {
	const me = this;
	const ports = me.ports;

	return ports.find((port) => port.getExternalPort() === port && port.isAvailable());
};

ConfigOS.prototype.hasPersonas = function() {
	return this.personas.length > 0;
};

ConfigOS.prototype.getPersona = function(index) {
	return this.personas[index];
};

module.exports = ConfigOS;