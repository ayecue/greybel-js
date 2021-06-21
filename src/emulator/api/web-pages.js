const db = require('./db');

exports.getIPByDomain = async function(domain) {
	const result = await db.client().get(`
		SELECT PublicIp
		FROM WebPages
		WHERE Address = $0
	`, [domain]);

	return result?.PublicIp;
};