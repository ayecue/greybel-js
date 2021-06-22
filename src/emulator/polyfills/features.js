module.exports = function(shell) {
	const api = {};

	api.__debugger = function __debugger (operationContext) {
		console.log('DEBUG', this, operationContext);
	};

	return api;
};