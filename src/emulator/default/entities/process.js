const Process = function(data) {
	const me = this;

	me.pid = data.PID;
	me.owner = data.nombreUser;
	me.name = data.nombreProceso;
	me.ramUsed = data.ramUsedMb;
	me.remotePid = data.remotePID;
	me.isScript = data.isScript;
	me.isProtected = data.isProtected;

	return me;
};

module.exports = Process;