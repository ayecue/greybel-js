module.exports = function(shell) {
	const api = {};

	api.__debugger = async function(operationContext) {
		console.log(operationContext);
		return null;
	};

	return api;
};