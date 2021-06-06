const print = (function() {
	return console.log;
})();
const active_user = function() {
	return $VM_INSTANCE.getLastSession().computer.getActiveUser().getName();
};
const current_path = function() {
	return $VM_INSTANCE.getLastSession().computer.fileSystem.cwd();
};
const format_columns = (v) => v;
const command_info = (v) => v;
const bitwise = function(operator, a, b) {
	//change parser to transfrom bitwise
	return eval([a, b].join(' ' + operator + ' '));
};
const user_input = function(question, isPassword) {
	const session = $VM_INSTANCE.getLastSession();

	return session.shell.prompt(question, isPassword);
};
const md5 = function(value) {
	return $VM_INSTANCE.tools.md5(value);
};
const params = function() {
	return CustomList(...$PARAMS_MAP);
};