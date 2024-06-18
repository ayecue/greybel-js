import {
  ASTAssignmentStatement,
  ASTBase,
  ASTCallExpression,
  ASTCallStatement,
  ASTChunk,
  ASTElseClause,
  ASTEvaluationExpression,
  ASTForGenericStatement,
  ASTFunctionStatement,
  ASTIfClause,
  ASTIfStatement,
  ASTIndexExpression,
  ASTListConstructorExpression,
  ASTListValue,
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

export interface ScraperMap {
  [key: string]: (item: any, level: number) => void;
}

const getScraperMap = function (
  visit: (o: ASTBase, level: number) => any
): ScraperMap {
  return {
    ParenthesisExpression: (item: ASTParenthesisExpression, level: number) => {
      visit(item.expression, level);
    },
    AssignmentStatement: function (
      item: ASTAssignmentStatement,
      level: number
    ) {
      visit(item.init, level);
      visit(item.variable, level);
    },
    MemberExpression: function (item: ASTMemberExpression, level: number) {
      visit(item.base, level);
      visit(item.identifier, level);
    },
    FunctionDeclaration: function (item: ASTFunctionStatement, level: number) {
      for (const parameterItem of item.parameters) {
        visit(parameterItem, level);
      }

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    MapConstructorExpression: function (
      item: ASTMapConstructorExpression,
      level: number
    ) {
      for (const fieldItem of item.fields) {
        visit(fieldItem, level);
      }
    },
    ReturnStatement: function (item: ASTReturnStatement, level: number) {
      if (item.argument) {
        visit(item.argument, level);
      }
    },
    WhileStatement: function (item: ASTWhileStatement, level: number) {
      visit(item.condition, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    IndexExpression: function (item: ASTIndexExpression, level: number) {
      visit(item.base, level);
      visit(item.index, level);
    },
    SliceExpression: function (item: ASTSliceExpression, level: number) {
      visit(item.base, level);
      visit(item.left, level);
      visit(item.right, level);
    },
    ListValue: function (item: ASTListValue, level: number) {
      visit(item.value, level);
    },
    MapKeyString: function (item: ASTMapKeyString, level: number) {
      visit(item.key, level);
      visit(item.value, level);
    },
    IfShortcutStatement: function (item: ASTIfStatement, level: number) {
      for (const clausesItem of item.clauses) {
        visit(clausesItem, level);
      }
    },
    IfShortcutClause: function (item: ASTIfClause, level: number) {
      visit(item.condition, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    ElseifShortcutClause: function (item: ASTIfClause, level: number) {
      visit(item.condition, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    ElseShortcutClause: function (item: ASTElseClause, level: number) {
      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    ForGenericStatement: function (
      item: ASTForGenericStatement,
      level: number
    ) {
      visit(item.variable, level);
      visit(item.iterator, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    IfStatement: function (item: ASTIfStatement, level: number) {
      for (const clausesItem of item.clauses) {
        visit(clausesItem, level);
      }
    },
    IfClause: function (item: ASTIfClause, level: number) {
      visit(item.condition, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    ElseifClause: function (item: ASTIfClause, level: number) {
      visit(item.condition, level);

      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    ElseClause: function (item: ASTElseClause, level: number) {
      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    NegationExpression: function (item: ASTUnaryExpression, level: number) {
      visit(item.argument, level);
    },
    CallExpression: function (item: ASTCallExpression, level: number) {
      visit(item.base, level);

      for (const argItem of item.arguments) {
        visit(argItem, level);
      }
    },
    CallStatement: function (item: ASTCallStatement, level: number) {
      visit(item.expression, level);
    },
    ListConstructorExpression: function (
      item: ASTListConstructorExpression,
      level: number
    ) {
      for (const fieldItem of item.fields) {
        visit(fieldItem, level);
      }
    },
    BinaryExpression: function (item: ASTEvaluationExpression, level: number) {
      visit(item.left, level);
      visit(item.right, level);
    },
    BinaryNegatedExpression: function (
      item: ASTUnaryExpression,
      level: number
    ) {
      visit(item.argument, level);
    },
    IsaExpression: function (item: ASTEvaluationExpression, level: number) {
      visit(item.left, level);
      visit(item.right, level);
    },
    LogicalExpression: function (item: ASTEvaluationExpression, level: number) {
      visit(item.left, level);
      visit(item.right, level);
    },
    UnaryExpression: function (item: ASTUnaryExpression, level: number) {
      visit(item.argument, level);
    },
    Chunk: function (item: ASTChunk, level: number) {
      for (const bodyItem of item.body) {
        visit(bodyItem, level);
      }
    },
    InvalidCodeExpression: () => {}
  };
};

interface ScraperState {
  exit: boolean;
  skip?: boolean;
}

type ScraperCallback = (item: any, level: number) => ScraperState;

class ScraperWalker {
  map: ScraperMap;
  callback: ScraperCallback;
  state: ScraperState;

  constructor(callback: ScraperCallback) {
    this.map = getScraperMap(this.visit.bind(this));
    this.callback = callback;
    this.state = {
      exit: false
    };
  }

  visit(o: ASTBase, level: number = 0) {
    const me = this;

    if (o == null) return;

    if (o.type == null) {
      console.error('Error ast type:', o);
      throw new Error('Unexpected as type');
    }

    me.state = me.callback(o, level);

    if (me.state.exit || me.state.skip) {
      return;
    }

    const next = me.map[o.type];

    if (next != null) {
      next.call(me, o, level + 1);
    }
  }
}

type ScraperValidateEx = (
  item: any,
  level: number
) => { valid?: boolean; skip?: boolean; exit?: boolean } | void;

export function findEx(
  validate: ScraperValidateEx,
  rootItem: ASTBase
): ASTBase[] {
  const result: ASTBase[] = [];
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    const state = validate(item, level) || {};

    if (state.valid && item.type !== ASTType.InvalidCodeExpression) {
      result.push(item);
    }

    return {
      exit: !!state.exit,
      skip: !!state.skip
    };
  });

  walker.visit(rootItem);
  return result;
}
