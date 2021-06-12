const CustomBoolean = require('./types/custom-boolean');
const CustomList = require('./types/custom-list');
const CustomMap = require('./types/custom-map');
const CustomNil = require('./types/custom-nil');
const CustomNumber = require('./types/custom-number');
const CustomString = require('./types/custom-string');

const isCustomValue = function(value) {
	return 	value instanceof CustomBoolean ||
			value instanceof CustomNumber ||
			value instanceof CustomList ||
			value instanceof CustomMap ||
			value instanceof CustomNil ||
			value instanceof CustomString;
};

const isCustomMap = function(value) {
	return 	value instanceof CustomMap;
};

const isCustomList = function(value) {
	return 	value instanceof CustomList;
};

const cast = function(value) {
	if (value == null)  return new CustomNil();

	if (isCustomValue(value)) {
		return value;
	}

	const type = typeof value;

	if (type === 'string') {
		return new CustomString(value);
	} else if (type === 'number') {
		return new CustomNumber(value);
	} else if (type === 'boolean') {
		return new CustomBoolean(value);
	} else if (type === 'object') {
		if (Array.isArray(value)) {
			value = value.map(cast);

			return new CustomList(value);
		}

		return new CustomMap(value);
	}

	throw new Error('Unexpected type');
};

exports.isCustomMap = isCustomMap;
exports.isCustomList = isCustomList;
exports.isCustomValue = isCustomValue;
exports.cast = cast;