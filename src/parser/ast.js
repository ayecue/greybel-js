const TOKENS = require('../lexer/tokens');

const AST = {
    breakStatement: function(line) {
        return {
            type: 'BreakStatement',
            line: line
        };
    },
    continueStatement: function(line) {
        return {
            type: 'ContinueStatement',
            line: line
        };
    },
    returnStatement: function(args, line) {
        return {
            type: 'ReturnStatement',
            'arguments': args,
            line: line
        };
    },
    ifShortcutStatement: function(clauses, line) {
        return {
            type: 'IfShortcutStatement',
            clauses: clauses,
            line: line
        };
    },
    ifShortcutClause: function(condition, statement, line) {
        return {
            type: 'IfShortcutClause',
            condition: condition,
            statement: statement,
            line: line
        };
    },
    elseifShortcutClause: function(condition, statement, line) {
        return {
            type: 'ElseifShortcutClause',
            condition: condition,
            statement: statement,
            line: line
        };
    },
    elseShortcutClause: function(statement, line) {
        return {
            type: 'ElseShortcutClause',
            statement: statement,
            line: line
        };
    },
    ifStatement: function(clauses, line) {
        return {
            type: 'IfStatement',
            clauses: clauses,
            line: line
        };
    },
    ifClause: function(condition, body, line) {
        return {
            type: 'IfClause',
            condition: condition,
            body: body,
            line: line
        };
    },
    elseifClause: function(condition, body, line) {
        return {
            type: 'ElseifClause',
            condition: condition,
            body: body,
            line: line
        };
    },
    elseClause: function(body, line) {
        return {
            type: 'ElseClause',
            body: body,
            line: line
        };
    },
    whileStatement: function(condition, body, line) {
        return {
            type: 'WhileStatement',
            condition: condition,
            body: body,
            line: line
        };
    },
    assignmentStatement: function(variable, init, line) {
        return {
            type: 'AssignmentStatement',
            variable: variable,
            init: init,
            line: line
        };
    },
    callStatement: function(expression, line) {
        return {
            type: 'CallStatement',
            expression: expression,
            line: line
        };
    },
    functionStatement: function(identifier, parameters, body, line) {
        return {
            type: 'FunctionDeclaration',
            identifier: identifier,
            parameters: parameters,
            body: body,
            line: line
        };
    },
    forGenericStatement: function(variable, iterator, body, line) {
        return {
            type: 'ForGenericStatement',
            variable: variable,
            iterator: iterator,
            body: body,
            line: line
        };
    },
    chunk: function(body, imports, nativeImports, includes, namespaces, line) {
        return {
            type: 'Chunk',
            body: body,
            nativeImports: nativeImports,
            imports: imports,
            includes: includes,
            namespaces: namespaces,
            line: line
        };
    },
    identifier: function(name, line) {
        return {
            type: 'Identifier',
            name: name,
            line: line
        };
    },
    literal: function(type, value, raw, line) {
        if (type === TOKENS.StringLiteral) type = 'StringLiteral';
        else if (type === TOKENS.NumericLiteral) type = 'NumericLiteral';
        else if (type === TOKENS.BooleanLiteral) type = 'BooleanLiteral';
        else if (type === TOKENS.NilLiteral) type = 'NilLiteral';

        return {
            type: type,
            value: value,
            raw: raw,
            line: line
        };
    },
    memberExpression: function(base, indexer, identifier, line) {
        return {
            type: 'MemberExpression',
            indexer: indexer,
            identifier: identifier,
            base: base,
            line: line
        };
    },
    callExpression: function(base, args, line) {
        return {
            type: 'CallExpression',
            base: base,
            'arguments': args,
            line: line
        };
    },
    comment: function(value, raw, line) {
        return {
            type: 'Comment',
            value: value,
            raw: raw,
            line: line
        };
    },
    unaryExpression: function(operator, arg, line) {
        if (operator === 'not') {
            return {
                type: 'NegationExpression',
                argument: arg,
                line: line
            };
        } else if (operator === '+' || operator === '-') {
            return {
                type: 'BinaryNegatedExpression',
                arg: arg,
                operator: operator,
                line: line
            };
        }

        return {
            type: 'UnaryExpression',
            operator: operator,
            argument: arg,
            line: line
        };
    },
    mapKeyString: function(key, value, line) {
        return {
            type: 'MapKeyString',
            key: key,
            value: value,
            line: line
        };
    },
    mapValue: function(value, line) {
        return {
            type: 'MapValue',
            value: value,
            line: line
        };
    },
    mapConstructorExpression: function(fields, line) {
        return {
            type: 'MapConstructorExpression',
            fields: fields,
            line: line
        };
    },
    mapCallExpression: function(base, args, line) {
        return {
            type: 'MapCallExpression',
            base: base,
            'arguments': args,
            line: line
        };
    },
    listValue: function(value, line) {
        return {
            type: 'ListValue',
            value: value,
            line: line
        };
    },
    listConstructorExpression: function(fields, line) {
        return {
            type: 'ListConstructorExpression',
            fields: fields,
            line: line
        };
    },
    listCallExpression: function(base, args, line) {
        return {
            type: 'ListCallExpression',
            base: base,
            'arguments': args,
            line: line
        };
    },
    emptyExpression: function(line) {
        return {
            type: 'EmptyExpression',
            line: line
        };
    },
    indexExpression: function(base, index, line) {
        return {
            type: 'IndexExpression',
            base: base,
            index: index,
            line: line
        };
    },
    binaryExpression: function(operator, left, right, line) {
        let type = 'BinaryExpression';
        if ('and' === operator || 'or' === operator) type = 'LogicalExpression';

        return {
            type: type,
            operator: operator,
            left: left,
            right: right,
            line: line
        };
    },
    featureImportExpression: function(name, path, line) {
        return {
            type: 'FeatureImportExpression',
            name: name,
            path: path,
            chunk: null,
            namespace: null,
            line: line
        };
    },
    featureIncludeExpression: function(path, line) {
        return {
            type: 'FeatureIncludeExpression',
            path: path,
            chunk: null,
            namespace: null,
            line: line
        };
    },
    featureEnvarExpression: function(name, line) {
        return {
            type: 'FeatureEnvarExpression',
            name: name,
            line: line
        };
    },
    featureDebuggerExpression: function(line) {
        return {
            type: 'FeatureDebuggerExpression',
            line: line
        };
    },
    sliceExpression: function(left, right, line) {
        return {
            type: 'SliceExpression',
            left: left,
            right: right,
            line: line
        };
    },
    importCodeExpression: function(gameDirectory, fileSystemDirectory, line) {
        return {
            type: 'ImportCodeExpression',
            gameDirectory: gameDirectory,
            fileSystemDirectory: fileSystemDirectory,
            line: line
        };
    }
};

module.exports = AST;