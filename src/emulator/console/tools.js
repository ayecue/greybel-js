const tools = require('../default/tools');
const webPagesClient = require('./api/web-pages');
const computerClient = require('./api/computer');

module.exports = {
	...tools,
	nslookup: async (domain) => {
		const ip = await webPagesClient.getIPByDomain(domain);

		return ip ? ip : 'Not found';
	},
	whois: async (ip) => {
		const persona = await computerClient.getPersonaByIP(ip);

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