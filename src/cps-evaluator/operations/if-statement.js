const IfOperation = require('./if');
const ElseIfOperation = require('./else-if');
const ElseOperation = require('./else');

const IfStatementOperation = function(ast) {
	const me = this;
	me.ast = ast;
	me.clauses = [];
	me.isOperation = true;
	return me;
};

IfStatementOperation.prototype.run = async function(operationContext) {
	const me = this;
	const clauses = me.clauses;

	for (let clause of clauses) {
		if (clause instanceof IfOperation || clause instanceof ElseIfOperation) {
			const isValid = await clause.condition.get(operationContext);

			if (isValid.valueOf()) {
				await clause.body.run(operationContext);
				break;
			}
		} else if (clause instanceof ElseOperation) {
			await clause.body.run(operationContext);
			break;
		} else {
			throw new Error('Invalid operation in if statement.');
		}
	}
};

module.exports = IfStatementOperation;