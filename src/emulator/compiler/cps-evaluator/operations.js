module.exports = {
	ArgumentOperation: require('./operations/argument'),
	WhileOperation: require('./operations/while'),
	ForOperation: require('./operations/for'),
	FunctionOperation: require('./operations/function'),
	ReturnOperation: require('./operations/return'),
	SliceOperation: require('./operations/slice'),
	ReferenceOperation: require('./operations/reference'),
	NewOperation: require('./operations/new'),
	NotOperation: require('./operations/not'),
	IfStatementOperation: require('./operations/if-statement'),
	IfOperation: require('./operations/if'),
	ElseIfOperation: require('./operations/else-if'),
	ElseOperation: require('./operations/else'),
	ContinueOperation: require('./operations/continue'),
	BreakOperation: require('./operations/break'),
	BodyOperation: require('./operations/body'),
	TopOperation: require('./operations/top')
};