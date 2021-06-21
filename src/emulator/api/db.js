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

    const windowsPath = path.resolve(directory, 'Grey Hack_Data/GreyHackDB.db');

    if (fs.existsSync(windowsPath)) {
        process.env['IS_WINDOWS'] = true;
        return windowsPath
    }

    const macPath = path.resolve(directory, 'Grey Hack.app/Contents/GreyHackDB.db');

    if (fs.existsSync(macPath)) {
        process.env['IS_MAC'] = true;
        return macPath;
    }

    return path.resolve(directory);
};

exports.client = function() {
    if (!instance) {
        instance = new sqlite3.Database(getDBFilePath());
    }

    return {
        run: util.promisify(instance.run.bind(instance)),
        get: util.promisify(instance.get.bind(instance)),
        all: util.promisify(instance.all.bind(instance))
    };
};

exports.parseBlob = function(blob) {
    return JSON.parse(blob.toString());
};