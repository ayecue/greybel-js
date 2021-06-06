const fs = require('fs');
const path = require('path');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();
let instance;

const getDBFilePath = function() {
    const directory = process.env['GREY_HACK_PATH'];

    if (!fs.existsSync(directory)) {
        console.error(directory);
        throw new Error('Define env GREY_HACK_PATH with Grey Hack game directory. (/SteamLibrary/steamapps/common/Grey Hack)');
    }

    return path.resolve(directory, 'Grey Hack_Data/GreyHackDB.db');
};

module.exports = function() {
    if (!instance) {
        instance = new sqlite3.Database(getDBFilePath());
    }

    return {
        run: util.promisify(instance.run.bind(instance)),
        get: util.promisify(instance.get.bind(instance))
    };
};