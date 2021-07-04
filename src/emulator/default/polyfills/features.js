module.exports = function(shell) {
	const api = {};

	api.__debugger = async function(operationContext) {
		return shell.breakpoint(operationContext);
	};

	return api;
};