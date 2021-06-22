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
	TopOperation,
	DebuggerOperation
} = require('./cps-evaluator/operations');
const CustomBoolean = require('./cps-evaluator/types/custom-boolean');
const CustomNumber = require('./cps-evaluator/types/custom-number');
const CustomString = require('./cps-evaluator/types/custom-string');
const CustomNil = require('./cps-evaluator/types/custom-nil');
const EventEmitter = require('events');

const mapper = function(visit, debug, raise) {
	return {
		'AssignmentStatement': function(item) {
			return new AssignExpression(item, visit, debug, raise);
		},
		'MemberExpression': function(item) {
			return new PathExpression(item, visit, debug, raise);
		},
		'FunctionDeclaration': function(item, operation) {
			const me = this;
			const op = new FunctionOperation(item, debug, raise);
			const args = new ArgumentOperation(item.parameters, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

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
			return new MapExpression(item, visit, debug, raise);
		},
		'Identifier': function(item) {
			return new PathExpression(item, visit, debug, raise);
		},
		'ReturnStatement': function(item) {
			const me = this;
			const op = new ReturnOperation(item, debug, raise);

			op.arg = visit(item.arguments[0]);

			return op;
		},
		'NumericLiteral': function(item) {
			return new CustomNumber(item.value);
		},
		'WhileStatement': function(item) {
			const me = this;
			const op = new WhileOperation(item, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

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
		'IndexExpression': function(item) {
			return new PathExpression(item, visit, debug, raise);
		},
		'FeatureEnvarExpression': function(item) {
			throw new Error('Not supported');
		},
		'IfShortcutStatement': function(item) {
			const me = this;
			const op = new IfStatementOperation(item, debug, raise);
			let clausesItem;

			for (clausesItem of item.clauses) {
				op.clauses.push(visit(clausesItem));
			}

			return op;
		},
		'IfShortcutClause': function(item) {
			const me = this;
			const op = new IfOperation(item, debug, raise);
			const body = new BodyOperation(item.statement, debug, raise);

			op.condition = visit(item.condition);

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'ElseifShortcutClause': function(item) {
			const me = this;
			const op = new ElseIfOperation(item, debug, raise);
			const body = new BodyOperation(item.statement, debug, raise);

			op.condition = visit(item.condition);

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'ElseShortcutClause': function(item) {
			const me = this;
			const op = new ElseOperation(item, debug, raise);
			const body = new BodyOperation(item.statement, debug, raise);

			body.stack.push(visit(item.statement));
			op.body = body;

			return op;
		},
		'NilLiteral': function(item) {
			return new CustomNil();
		},
		'ForGenericStatement': function(item) {
			const me = this;
			const op = new ForOperation(item, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

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
			const op = new IfStatementOperation(item, debug, raise);
			let clausesItem;

			for (clausesItem of item.clauses) {
				op.clauses.push(visit(clausesItem));
			}

			return op;
		},
		'IfClause': function(item) {
			const me = this;
			const op = new IfOperation(item, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

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
			const op = new ElseIfOperation(item, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

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
			const op = new ElseOperation(item, debug, raise);
			const body = new BodyOperation(item.body, debug, raise);

			let bodyItem;

			for (bodyItem of item.body) {
				body.stack.push(visit(bodyItem));
			}

			op.body = body;

			return op;
		},
		'NegationExpression': function(item) {
			const me = this;
			const op = new NotOperation(item, debug, raise);

			op.arg = visit(item.argument);

			return op;
		},
		'ContinueStatement': function(item) {
			return new ContinueOperation(item, debug, raise);
		},
		'BreakStatement': function(item) {
			return new BreakOperation(item, debug, raise);
		},
		'CallExpression': function(item) {
			return new CallExpression(item, visit, debug, raise);
		},
		'CallStatement': function(item) {
			return new CallExpression(item, visit, debug, raise);
		},
		'FeatureImportExpression': function(item) {
			throw new Error('Not supported');
		},
		'FeatureIncludeExpression': function(item) {
			throw new Error('Not supported');
		},
		'FeatureDebuggerExpression': function(item) {
			return new DebuggerOperation(item, debug, raise);
		},
		'ListConstructorExpression': function(item) {
			return new ListExpression(item, visit, debug, raise);
		},
		'BooleanLiteral': function(item) {
			return new CustomBoolean(item.value);
		},
		'EmptyExpression': function(item) {},
		'BinaryExpression': function(item) {
			return new LogicalAndBinaryExpression(item, visit, debug, raise);
		},
		'LogicalExpression': function(item) {
			return new LogicalAndBinaryExpression(item, visit, debug, raise);
		},
		'UnaryExpression': function(item) {
			const me = this;
			let op;

			if ('@' === item.operator) op = new ReferenceOperation(item, debug, raise);
			if ('new' === item.operator) op = new NewOperation(item, debug, raise);

			op.arg = visit(item.argument);

			return op;
		},
		'Chunk': function(item) {
			const me = this;
			const op = new BodyOperation(item, debug, raise);

			let bodyItem;

			for (bodyItem of item.body) {
				op.stack.push(visit(bodyItem));
			}

			return op;
		}
	};
};

const CPSEvaluatorWalker = function(debug, raise) {
	const me = this;
	me.mapper = mapper(me.visit.bind(me), debug, raise);
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

const CPSEvaluator = function(options) {
	const me = this;

	me.chunk = options.chunk;
	me.debug = options.debug;
	me.raise = options.raise;

	return me;
};

CPSEvaluator.prototype.digest = function() {
	const me = this;
	const cpsWalker = new CPSEvaluatorWalker(me.debug, me.raise);
	const topOperation = new TopOperation();

	topOperation.body = cpsWalker.visit(me.chunk);

	return topOperation;
};

module.exports = function(options) {
	return (new CPSEvaluator(options)).digest();
};