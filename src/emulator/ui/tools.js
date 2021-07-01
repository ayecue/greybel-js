const tools = require('../default/tools');
const webPagesClient = require('./api/web-pages');
const computerClient = require('./api/computer');

module.exports = {
	...tools,
	nslookup: (domain) => {
		const ip = webPagesClient.getIPByDomain(domain);

		return ip ? ip : 'Not found';
	},
	whois: (ip) => {
		const persona = computerClient.getPersonaByIP(ip);

		return persona 
			? [
				`Domain name: ${persona.webAddress}`,
				`Administrative contact: ${persona.contact.firstname} ${persona.contact.lastname}`,
				`Email address: ${persona.mail}`,
				`Phone: ${persona.phone}`
			].join('\n')
			: 'No Info available';
	}
};