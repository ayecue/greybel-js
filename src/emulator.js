const VM = require('./emulator/vm');

module.exports = () => (new VM()).start();