import { Context } from 'greybel-transpiler';
import { ASTImportCodeExpression } from 'greyscript-core';
import {
  BuildMap,
  Transformer,
  TransformerDataObject
} from 'greyscript-transpiler';
import {
  ASTAssignmentStatement,
  ASTBase,
  ASTCallExpression,
  ASTCallStatement,
  ASTChunk,
  ASTComment,
  ASTElseClause,
  ASTEvaluationExpression,
  ASTForGenericStatement,
  ASTFunctionStatement,
  ASTIdentifier,
  ASTIfClause,
  ASTIfStatement,
  ASTIndexExpression,
  ASTListConstructorExpression,
  ASTListValue,
  ASTLiteral,
  ASTMapConstructorExpression,
  ASTMapKeyString,
  ASTMemberExpression,
  ASTParenthesisExpression,
  ASTReturnStatement,
  ASTSliceExpression,
  ASTType,
  ASTUnaryExpression,
  ASTWhileStatement
} from 'miniscript-core';

export function stringifyFactory(
  make: (item: ASTBase, _data?: TransformerDataObject) => string
): BuildMap {
  return {
    ParenthesisExpression: (
      item: ASTParenthesisExpression,
      _data: TransformerDataObject
    ): string => {
      const expr = make(item.expression);

      return '(' + expr + ')';
    },
    Comment: (item: ASTComment, _data: TransformerDataObject): string => {
      return '//' + item.value;
    },
    AssignmentStatement: (
      item: ASTAssignmentStatement,
      _data: TransformerDataObject
    ): string => {
      const varibale = item.variable;
      const init = item.init;
      const left = make(varibale);
      const right = make(init);

      return left + '=' + right;
    },
    MemberExpression: (
      item: ASTMemberExpression,
      _data: TransformerDataObject
    ): string => {
      const identifier = make(item.identifier);
      const base = make(item.base);

      return [base, identifier].join(item.indexer);
    },
    FunctionDeclaration: (
      item: ASTFunctionStatement,
      _data: TransformerDataObject
    ): string => {
      const parameters = [];
      const body = [];
      let parameterItem;
      let bodyItem;

      for (parameterItem of item.parameters) {
        parameters.push(make(parameterItem));
      }

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return (
        'function(' +
        parameters.join(',') +
        ')\n' +
        body.join('\n') +
        '\nend function'
      );
    },
    MapConstructorExpression: (
      item: ASTMapConstructorExpression,
      _data: TransformerDataObject
    ): string => {
      const fields = [];
      let fieldItem;

      for (fieldItem of item.fields) {
        fields.push(make(fieldItem));
      }

      return '{' + fields.join(',') + '}';
    },
    MapKeyString: (
      item: ASTMapKeyString,
      _data: TransformerDataObject
    ): string => {
      const key = make(item.key);
      const value = make(item.value);

      return [key, value].join(':');
    },
    Identifier: (item: ASTIdentifier, _data: TransformerDataObject): string => {
      return item.name;
    },
    ReturnStatement: (
      item: ASTReturnStatement,
      _data: TransformerDataObject
    ): string => {
      const arg = item.argument ? make(item.argument) : '';
      return 'return ' + arg;
    },
    NumericLiteral: (
      item: ASTLiteral,
      _data: TransformerDataObject
    ): string => {
      return item.value.toString();
    },
    WhileStatement: (
      item: ASTWhileStatement,
      _data: TransformerDataObject
    ): string => {
      const condition = make(item.condition);
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return 'while ' + condition + '\n' + body.join('\n') + '\nend while';
    },
    CallExpression: (
      item: ASTCallExpression,
      _data: TransformerDataObject
    ): string => {
      const base = make(item.base);
      const args = [];
      let argItem;

      for (argItem of item.arguments) {
        args.push(make(argItem));
      }

      if (args.length === 0) {
        return base;
      }

      return base + '(' + args.join(',') + ')';
    },
    StringLiteral: (item: ASTLiteral, _data: TransformerDataObject): string => {
      return item.raw.toString();
    },
    SliceExpression: (
      item: ASTSliceExpression,
      _data: TransformerDataObject
    ): string => {
      const base = make(item.base);
      const left = make(item.left);
      const right = make(item.right);

      return base + '[' + [left, right].join(':') + ']';
    },
    IndexExpression: (
      item: ASTIndexExpression,
      _data: TransformerDataObject
    ): string => {
      const base = make(item.base);

      if (
        item.index instanceof ASTLiteral &&
        item.index.type === ASTType.StringLiteral
      ) {
        return [base, item.index.value.toString()].join('.');
      }

      const index = make(item.index);

      return base + '[' + index + ']';
    },
    UnaryExpression: (
      item: ASTUnaryExpression,
      _data: TransformerDataObject
    ): string => {
      const arg = make(item.argument);

      if (item.operator === 'new') return item.operator + ' ' + arg;

      return item.operator + arg;
    },
    NegationExpression: (
      item: ASTUnaryExpression,
      _data: TransformerDataObject
    ): string => {
      const arg = make(item.argument);

      return 'not ' + arg;
    },
    FeatureEnvarExpression: (): string => {
      return 'null';
    },
    IfShortcutStatement: (
      item: ASTIfStatement,
      _data: TransformerDataObject
    ): string => {
      const clauses = [];
      let clausesItem;

      for (clausesItem of item.clauses) {
        clauses.push(make(clausesItem));
      }

      return clauses.join('\n') + '\nend if';
    },
    IfShortcutClause: (
      item: ASTIfClause,
      _data: TransformerDataObject
    ): string => {
      const condition = make(item.condition);
      const statement = make(item.body[0]);

      return 'if ' + condition + ' then\n' + statement;
    },
    ElseifShortcutClause: (
      item: ASTIfClause,
      _data: TransformerDataObject
    ): string => {
      const condition = make(item.condition);
      const statement = make(item.body[0]);

      return 'else if ' + condition + ' then\n' + statement;
    },
    ElseShortcutClause: (
      item: ASTElseClause,
      _data: TransformerDataObject
    ): string => {
      const statement = make(item.body[0]);

      return 'else\n' + statement;
    },
    NilLiteral: (_item: ASTLiteral, _data: TransformerDataObject): string => {
      return 'null';
    },
    ForGenericStatement: (
      item: ASTForGenericStatement,
      _data: TransformerDataObject
    ): string => {
      const variable = make(item.variable);
      const iterator = make(item.iterator);
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return (
        'for ' +
        variable +
        ' in ' +
        iterator +
        '\n' +
        body.join('\n') +
        '\nend for'
      );
    },
    IfStatement: (
      item: ASTIfStatement,
      _data: TransformerDataObject
    ): string => {
      const clauses = [];
      let clausesItem;

      for (clausesItem of item.clauses) {
        clauses.push(make(clausesItem));
      }

      return clauses.join('\n') + '\nend if';
    },
    IfClause: (item: ASTIfClause, _data: TransformerDataObject): string => {
      const condition = make(item.condition);
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return 'if ' + condition + ' then\n' + body.join('\n');
    },
    ElseifClause: (item: ASTIfClause, _data: TransformerDataObject): string => {
      const condition = make(item.condition);
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return 'else if ' + condition + ' then\n' + body.join('\n');
    },
    ElseClause: (item: ASTElseClause, _data: TransformerDataObject): string => {
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return 'else\n' + body.join('\n');
    },
    ContinueStatement: (
      _item: ASTBase,
      _data: TransformerDataObject
    ): string => {
      return 'continue';
    },
    BreakStatement: (_item: ASTBase, _data: TransformerDataObject): string => {
      return 'break';
    },
    CallStatement: (
      item: ASTCallStatement,
      _data: TransformerDataObject
    ): string => {
      return make(item.expression);
    },
    FeatureImportExpression: (): string => {
      return '';
    },
    FeatureIncludeExpression: (): string => {
      return '';
    },
    FeatureDebuggerExpression: (
      _item: ASTBase,
      _data: TransformerDataObject
    ): string => {
      return '';
    },
    ListConstructorExpression: (
      item: ASTListConstructorExpression,
      _data: TransformerDataObject
    ): string => {
      const fields = [];
      let fieldItem;

      for (fieldItem of item.fields) {
        fields.push(make(fieldItem));
      }

      return '[' + fields.join(',') + ']';
    },
    ListValue: (item: ASTListValue, _data: TransformerDataObject): string => {
      return make(item.value);
    },
    BooleanLiteral: (
      item: ASTLiteral,
      _data: TransformerDataObject
    ): string => {
      return item.raw.toString();
    },
    EmptyExpression: (_item: ASTBase, _data: TransformerDataObject): string => {
      return '';
    },
    IsaExpression: (
      item: ASTEvaluationExpression,
      _data: TransformerDataObject
    ): string => {
      const left = make(item.left);
      const right = make(item.right);

      return left + ' ' + item.operator + ' ' + right;
    },
    LogicalExpression: (
      item: ASTEvaluationExpression,
      _data: TransformerDataObject
    ): string => {
      const left = make(item.left);
      const right = make(item.right);

      return left + ' ' + item.operator + ' ' + right;
    },
    BinaryExpression: (
      item: ASTEvaluationExpression,
      _data: TransformerDataObject
    ): string => {
      const left = make(item.left);
      const right = make(item.right);
      const operator = item.operator;
      let expression = left + operator + right;

      if (
        operator === '<<' ||
        operator === '>>' ||
        operator === '>>>' ||
        operator === '|' ||
        operator === '&'
      ) {
        expression =
          'bitwise(' + ['"' + operator + '"', left, right].join(',') + ')';
      }

      return expression;
    },
    BinaryNegatedExpression: (
      item: ASTUnaryExpression,
      _data: TransformerDataObject
    ): string => {
      const arg = make(item.argument);
      const operator = item.operator;

      return operator + arg;
    },
    Chunk: (item: ASTChunk, _data: TransformerDataObject): string => {
      const body = [];
      let bodyItem;

      for (bodyItem of item.body) {
        const transformed = make(bodyItem);
        if (transformed === '') continue;
        body.push(transformed);
      }

      return body.join('\n');
    },
    ImportCodeExpression: (
      item: ASTImportCodeExpression,
      _data: TransformerDataObject
    ): string => {
      return `import_code("${item.directory}")`;
    },
    InvalidCodeExpression: (): string => {
      return '';
    }
  };
}

export default function transform(item: ASTBase): string {
  const transformer = new Transformer(
    stringifyFactory,
    <Context>(<unknown>{}),
    new Map()
  );
  return transformer.make(item);
}
