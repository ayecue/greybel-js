const typer = require('../../../cps-evaluator/typer');

module.exports = function(shell) {
	const api = {};

	api.abs = function(number) {
		const value = Math.abs(number.valueOf());
		return typer.cast(value);
	};
	api.acos = function(number) {
		const value = Math.acos(number.valueOf());
		return typer.cast(value);
	};
	api.asin = function(number) {
		const value = Math.asin(number.valueOf());
		return typer.cast(value);
	};
	api.atan = function(number) {
		const value = Math.atan(number.valueOf());
		return typer.cast(value);
	};
	api.tan = function(number) {
		const value = Math.tan(number.valueOf());
		return typer.cast(value);
	};
	api.cos = function(number) {
		const value = Math.cos(number.valueOf());
		return typer.cast(value);
	};
	api.sin = function(number) {
		const value = Math.sin(number.valueOf());
		return typer.cast(value);
	};
	api.floor = function(number) {
		const value = Math.floor(number.valueOf());
		return typer.cast(value);
	};
	api.range = function(startValue, endValue, inc = 1) {
		const result = [];
		let index;
		let max;

		if (endValue == null) {
			index = 0;
			max = startValue.valueOf();
		} else {
			index = startValue.valueOf();
			max = endValue.valueOf();
		}

		for (; index < max; index += inc) {
			result.push(index);
		}
		return typer.cast(result);
	};
	api.round = function(value, x = 0) {
		value = value.valueOf().toFixed(x.valueOf());
		return typer.cast(value);
	};
	api.rnd = function(seed) {
		return typer.cast(shell.tools.rnd(seed.valueOf()));
	};
	api.sign = function(number) {
		const value = Math.sign(number.valueOf());
		return typer.cast(value);
	};
	api.str = function(number) {
		const value = number.valueOf().toString();
		return typer.cast(value);
	};
	api.ceil = function(number) {
		const value = Math.ceil(number.valueOf());
		return typer.cast(value);
	};
	api.pi = function() {
		const value = Math.PI.toFixed(14);
		return typer.cast(value);
	};

	return api;
};