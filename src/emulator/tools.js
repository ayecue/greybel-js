const webPagesClient = require('./api/web-pages');
const computerClient = require('./api/computer');

module.exports = {
	md5: require('../utils/md5'),
	rng: require('../utils/rng-provider')(),
	isValidIP: (ip) => {
		return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})$/.test(ip);
	},
	isLanIP: (ip) => {
		return /^192\.168\.(25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\.(25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})$/.test(ip);
	},
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