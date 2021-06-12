const PRECEDENCE_MAP = {
    '^': 12,
    '*': 10,
    '%': 10,
    '/': 10,
    '+': 9,
    '-': 9,
    '&': 6,
    '|': 4,
    '<': 3,
    '>': 3,
    '<<': 7,
    '>>': 7,
    '<=': 3,
    '>=': 3,
    '==': 3,
    'or': 1,
    '>>>': 7,
    'and': 2
};

module.exports = function(operator) {
    return PRECEDENCE_MAP[operator] || 0;
};