const parseJSON = function(obj) {
	if (Buffer.isBuffer(obj)) {
		obj = obj.toString('utf-8');
	}
	return JSON.parse(obj);
};

exports.JSON = function(fn) {
	return (obj) => fn(parseJSON(obj));
};