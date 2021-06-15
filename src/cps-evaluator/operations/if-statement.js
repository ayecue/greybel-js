const IfOperation = require('./if');
const ElseIfOperation = require('./else-if');
const ElseOperation = require('./else');

const IfStatementOperation = function(ast, debug, raise) {
	const me = this;
	me.ast = ast;
	me.clauses = [];
	me.isOperation = true;
	me.debug = debug;
	me.raise = raise;
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
			me.raise('Invalid operation in if statement.', me, clause);
		}
	}
};

module.exports = IfStatementOperation;