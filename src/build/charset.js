const generateChars = function(from, to) {
	let output = ''
	while (from <= to) {
		output = output + String.fromCharCode(from)
		from = from + 1
	}
	return output
};

module.exports = function(obfuscation) {
	const ALPHABETIC_CHARACTERS_UPPER = generateChars(65, 90);
	const ALPHABETIC_CHARACTERS_LOWER = generateChars(97, 122);
	const NUMBER_CHARACTERS = generateChars(48, 57);
	let SPECIAL_CHARACTERS = '_';

	if (obfuscation) {
		SPECIAL_CHARACTERS = SPECIAL_CHARACTERS + generateChars(1000, 2000);
	}

	return {
		VARS: ALPHABETIC_CHARACTERS_UPPER + ALPHABETIC_CHARACTERS_LOWER + SPECIAL_CHARACTERS,
		MODULES: ALPHABETIC_CHARACTERS_UPPER + ALPHABETIC_CHARACTERS_LOWER + NUMBER_CHARACTERS + SPECIAL_CHARACTERS
	};
};