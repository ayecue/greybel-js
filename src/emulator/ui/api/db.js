const LocalStorageDB = require('localstoragedb');
const memory = new Map();
const db = new LocalStorageDB('database', memory);
const defaultData = {
	computers: require('./fixtures/Computer.json'),
	files: require('./fixtures/Files.json'),
	infoGen: require('./fixtures/InfoGen.json'),
	maps: require('./fixtures/Map.json'),
	osPasswords: require('./fixtures/OSPasswords.json'),
	passwords: require('./fixtures/Passwords.json'),
	players: require('./fixtures/Players.json'),
	webPages: require('./fixtures/WebPages.json')
};

if(db.isNew()) {
	Object
		.entries(defaultData)
		.forEach(function([table, data]) {
			db.createTableWithData(table, data);
		});

	db.commit();
}

exports.client = db;