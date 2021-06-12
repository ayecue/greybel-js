const {
	AssignExpression,
	CallExpression,
	ListExpression,
	LogicalAndBinaryExpression,
	MapExpression,
	PathExpression
} = require('./cps-evaluator/expressions');
const {
	ArgumentOperation,
	WhileOperation,
	ForOperation,
	FunctionOperation,
	ReturnOperation,
	SliceOperation,
	ReferenceOperation,
	NewOperation,
	NotOperation,
	IfStatementOperation,
	IfOperation,
	ElseIfOperation, 
	ElseOperation,
	ContinueOperation,
	BreakOperation,
	BodyOperation,
	TopOperation
} = require('./cps-evaluator/operations');
const CustomBoolean = require('./cps-evaluator/types/custom-boolean');
const CustomNumber = require('./cps-evaluator/types/custom-number');
const CustomString = require('./cps-evaluator/types/custom-string');
const CustomNil = require('./cps-evaluator/types/custom-nil');

const mapper = function(visit) {
	return {
		'AssignmentStatement': function(item) {
			return new AssignExpression(item, visit);
		},
		'MemberExpression': function(item) {
			return new PathExpression(item, visit);
		},
		'FunctionDeclaration': function(item, operation) {
			const me = this;
			const op = new FunctionOperation(item);
			const args = new ArgumentOperation();
			const body = new BodyOperation();

			for (parameterItem of item.parameters) {
				args.stack.push(visit(parameterItem));
			}

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.args = args;
			op.body = body;

			return op;
		},
		'MapConstructorExpression': function(item, operation) {
			return new MapExpression(item, visit);
		},
		'Identifier': function(item) {
			return new PathExpression(item, visit);
		},
		'ReturnStatement': function(item) {
			const me = this;
			const op = new ReturnOperation(item);

			op.arg = visit(item.arguments[0]);

			return op;
		},
		'NumericLiteral': function(item) {
			return new CustomNumber(item.value);
		},
		'WhileStatement': function(item) {
			const me = this;
			const op = new WhileOperation(item);
			const body = new BodyOperation();

			op.condition = visit(item.condition);

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'StringLiteral': function(item) {
			return new CustomString(item.value);
		},
		'SliceExpression': function(item) {
			const me = this;
			const op = new SliceOperation(item);

			op.left = visit(item.left);
			op.right = visit(item.right);

			return op;
		},
		'IndexExpression': function(item) {
			return new PathExpression(item, visit);
		},
		'FeatureEnvarExpression': function(item) {
			throw new Error('Not supported');
		},
		'IfShortcutStatement': function(item) {
			const me = this;
			const op = new IfStatementOperation(item);
			let clausesItem;

			for (clausesItem of item.clauses) {
				op.clauses.push(visit(clausesItem));
			}

			return op;
		},
		'IfShortcutClause': function(item) {
			const me = this;
			const op = new IfOperation(item);
			const body = new BodyOperation();

			op.condition = visit(item.condition);

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'ElseifShortcutClause': function(item) {
			const me = this;
			const op = new ElseIfOperation(item);
			const body = new BodyOperation();

			op.condition = visit(item.condition);

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'ElseShortcutClause': function(item) {
			const me = this;
			const op = new ElseOperation(item);
			const body = new BodyOperation();

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'NilLiteral': function(item) {
			return new CustomNil();
		},
		'ForGenericStatement': function(item) {
			const me = this;
			const op = new ForOperation(item);
			const body = new BodyOperation();

			op.variable = visit(item.variable);
			op.iterator = visit(item.iterator);

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'IfStatement': function(item) {
			const me = this;
			const op = new IfStatementOperation(item);
			let clausesItem;

			for (clausesItem of item.clauses) {
				op.clauses.push(visit(clausesItem));
			}

			return op;
		},
		'IfClause': function(item) {
			const me = this;
			const op = new IfOperation(item);
			const body = new BodyOperation();

			op.condition = visit(item.condition);

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'ElseifClause': function(item) {
			const me = this;
			const op = new ElseIfOperation(item);
			const body = new BodyOperation();

			op.condition = visit(item.condition);

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'ElseClause': function(item) {
			const me = this;
			const op = new ElseOperation(item);
			const body = new BodyOperation();

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'NegationExpression': function(item) {
			const me = this;
			const op = new NotOperation(item);

			op.arg = visit(item.argument);

			return op;
		},
		'ContinueStatement': function(item) {
			return new ContinueOperation(item);
		},
		'BreakStatement': function(item) {
			return new BreakOperation(item);
		},
		'CallExpression': function(item) {
			return new CallExpression(item, visit);
		},
		'CallStatement': function(item) {
			return new CallExpression(item, visit);
		},
		'FeatureImportExpression': function(item) {
			throw new Error('Not supported');
		},
		'FeatureIncludeExpression': function(item) {
			throw new Error('Not supported');
		},
		'ListConstructorExpression': function(item) {
			return new ListExpression(item, visit);
		},
		'BooleanLiteral': function(item) {
			return new CustomBoolean(item.value);
		},
		'EmptyExpression': function(item) {},
		'BinaryExpression': function(item) {
			return new LogicalAndBinaryExpression(item, visit);
		},
		'LogicalExpression': function(item) {
			return new LogicalAndBinaryExpression(item, visit);
		},
		'UnaryExpression': function(item) {
			const me = this;
			let op;

			if ('@' === item.operator) op = new ReferenceOperation(item);
			if ('new' === item.operator) op = new NewOperation(item);

			op.arg = visit(item.argument);

			return op;
		},
		'Chunk': function(item) {
			const me = this;
			const op = new BodyOperation(item);

			let bodyItem;

			for (bodyItem of item.body) {
				op.stack.push(visit(bodyItem));
			}

			return op;
		}
	};
};

const CPSEvaluatorWalker = function() {
	const me = this;
	me.mapper = mapper(me.visit.bind(me))
	return me;
}

CPSEvaluatorWalker.prototype.visit = function(o, ...args) {
	const me = this;
	if (o == null) return '';
	if (o.type == null) {
		console.error('Error ast type:', o);
		throw new Error('Unexpected as type');
	}
	const fn = me.mapper[o.type];
	if (fn == null) {
		console.error('Error ast:', o);
		throw new Error('Type does not exist ' + o.type);
	}
	const result = fn.call(me, o, ...args);
	return result;
};

const CPSEvaluator = function(chunk) {
	const me = this;
	me.chunk = chunk;
	return me;
};

CPSEvaluator.prototype.digest = function() {
	const me = this;
	const cpsWalker = new CPSEvaluatorWalker();
	const topOperation = new TopOperation();

	topOperation.body = cpsWalker.visit(me.chunk);

	return topOperation;
};

module.exports = function(chunk) {
	return (new CPSEvaluator(chunk)).digest();
};