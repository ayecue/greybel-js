const TOKENS = require('../lexer/tokens');

const AST = {
    breakStatement: function() {
        return {
            type: 'BreakStatement'
        };
    },
    continueStatement: function() {
        return {
            type: 'ContinueStatement'
        };
    },
    returnStatement: function(args) {
        return {
            type: 'ReturnStatement',
            'arguments': args
        };
    },
    ifShortcutStatement: function(clauses) {
        return {
            type: 'IfShortcutStatement',
            clauses: clauses
        };
    },
    ifShortcutClause: function(condition, statement) {
        return {
            type: 'IfShortcutClause',
            condition: condition,
            statement: statement
        };
    },
    elseifShortcutClause: function(condition, statement) {
        return {
            type: 'ElseifShortcutClause',
            condition: condition,
            statement: statement
        };
    },
    elseShortcutClause: function(statement) {
        return {
            type: 'ElseShortcutClause',
            statement: statement
        };
    },
    ifStatement: function(clauses) {
        return {
            type: 'IfStatement',
            clauses: clauses
        };
    },
    ifClause: function(condition, body) {
        return {
            type: 'IfClause',
            condition: condition,
            body: body
        };
    },
    elseifClause: function(condition, body) {
        return {
            type: 'ElseifClause',
            condition: condition,
            body: body
        };
    },
    elseClause: function(body) {
        return {
            type: 'ElseClause',
            body: body
        };
    },
    whileStatement: function(condition, body) {
        return {
            type: 'WhileStatement',
            condition: condition,
            body: body
        };
    },
    assignmentStatement: function(variable, init) {
        return {
            type: 'AssignmentStatement',
            variable: variable,
            init: init
        };
    },
    callStatement: function(expression) {
        return {
            type: 'CallStatement',
            expression: expression
        };
    },
    functionStatement: function(identifier, parameters, body) {
        return {
            type: 'FunctionDeclaration',
            identifier: identifier,
            parameters: parameters,
            body: body
        };
    },
    forGenericStatement: function(variable, iterator, body) {
        return {
            type: 'ForGenericStatement',
            variable: variable,
            iterator: iterator,
            body: body
        };
    },
    chunk: function(body, imports, includes, namespaces) {
        return {
            type: 'Chunk',
            body: body,
            imports: imports,
            includes: includes,
            namespaces: namespaces
        };
    },
    identifier: function(name) {
        return {
            type: 'Identifier',
            name: name
        };
    },
    literal: function(type, value, raw) {
        if (type === TOKENS.StringLiteral) type = 'StringLiteral';
        else if (type === TOKENS.NumericLiteral) type = 'NumericLiteral';
        else if (type === TOKENS.BooleanLiteral) type = 'BooleanLiteral';
        else if (type === TOKENS.NilLiteral) type = 'NilLiteral';

        return {
            type: type,
            value: value,
            raw: raw
        };
    },
    memberExpression: function(base, indexer, identifier) {
        return {
            type: 'MemberExpression',
            indexer: indexer,
            identifier: identifier,
            base: base
        };
    },
    callExpression: function(base, args) {
        return {
            type: 'CallExpression',
            base: base,
            'arguments': args
        };
    },
    comment: function(value, raw) {
        return {
            type: 'Comment',
            value: value,
            raw: raw
        };
    },
    unaryExpression: function(operator, argument) {
        return {
            type: 'UnaryExpression',
            operator: operator,
            argument: argument
        };
    },
    mapKeyString: function(key, value) {
        return {
            type: 'MapKeyString',
            key: key,
            value: value
        };
    },
    mapValue: function(value) {
        return {
            type: 'MapValue',
            value: value
        };
    },
    mapConstructorExpression: function(fields) {
        return {
            type: 'MapConstructorExpression',
            fields: fields
        };
    },
    mapCallExpression: function(base, args) {
        return {
            type: 'MapCallExpression',
            base: base,
            'arguments': args
        };
    },
    listValue: function(value) {
        return {
            type: 'ListValue',
            value: value
        };
    },
    listConstructorExpression: function(fields) {
        return {
            type: 'ListConstructorExpression',
            fields: fields
        };
    },
    listCallExpression: function(base, args) {
        return {
            type: 'ListCallExpression',
            base: base,
            'arguments': args
        };
    },
    emptyExpression: function() {
        return {
            type: 'EmptyExpression'
        };
    },
    indexExpression: function(base, index) {
        return {
            type: 'IndexExpression',
            base: base,
            index: index
        };
    },
    binaryExpression: function(operator, left, right, isWrapped) {
      let type = 'BinaryExpression';
      if ('and' === operator || 'or' === operator) type = 'LogicalExpression';

      return {
        type: type,
        operator: operator,
        left: left,
        right: right,
        isWrapped: isWrapped === true
      };
    },
    featureImportExpression: function(name, path) {
        return {
            type: 'FeatureImportExpression',
            name: name,
            path: path,
            chunk: null,
            namespace: null
        };
    },
    featureIncludeExpression: function(path) {
        return {
            type: 'FeatureIncludeExpression',
            path: path,
            chunk: null,
            namespace: null
        };
    },
    featureEnvarExpression: function(name) {
        return {
            type: 'FeatureEnvarExpression',
            name: name
        };
    }
};

module.exports = AST;