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
  ASTMapConstructorExpression,
  ASTMemberExpression,
  ASTReturnStatement,
  ASTUnaryExpression,
  ASTWhileStatement
} from 'greybel-core';

export interface ScraperMap {
  [key: string]: (item: any, level: number) => void;
}

const getScraperMap = function (
  visit: (o: ASTBase, level: number) => any
): ScraperMap {
  return {
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
    }
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

type ScraperNext = (item: any, level: number) => void;
type ScraperValidate = (item: any, level: number) => boolean;
type ScraperValidateEx = (
  item: any,
  level: number
) => { valid?: boolean; skip?: boolean; exit?: boolean } | void;

export function forEach(next: ScraperNext, rootItem: ASTBase): ASTBase | null {
  const result = null;
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    next(item, level);
    return {
      exit: false
    };
  });

  walker.visit(rootItem);
  return result;
}

export function find(
  validate: ScraperValidate,
  rootItem: ASTBase
): ASTBase | null {
  let result = null;
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    if (validate(item, level)) {
      result = item;

      return {
        exit: true
      };
    }

    return {
      exit: false
    };
  });

  walker.visit(rootItem);
  return result;
}

export function findAll(
  validate: ScraperValidate,
  rootItem: ASTBase
): ASTBase[] {
  const result: ASTBase[] = [];
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    if (validate(item, level)) {
      result.push(item);
    }

    return {
      exit: false
    };
  });

  walker.visit(rootItem);
  return result;
}

export function findEx(
  validate: ScraperValidateEx,
  rootItem: ASTBase
): ASTBase[] {
  const result: ASTBase[] = [];
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    const state = validate(item, level) || {};

    if (state.valid) {
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

export function findAllByType(
  validate: ScraperValidate,
  rootItem: ASTBase
): { [type: string]: ASTBase[] } {
  const result: { [type: string]: ASTBase[] } = {};
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    const typeResult = result[item.type] || [];

    if (validate(item, level)) {
      typeResult.push(item);
      result[item.type] = typeResult;
    }

    return {
      exit: false
    };
  });

  walker.visit(rootItem);
  return result;
}

export function findAllByLine(
  validate: ScraperValidate,
  rootItem: ASTBase
): { [type: number]: ASTBase[] } {
  const result: { [type: number]: ASTBase[] } = {};
  const walker = new ScraperWalker((item: ASTBase, level: number) => {
    const typeResult = result[item.start!.line] || [];

    if (validate(item, level)) {
      typeResult.push(item);
      result[item.start!.line] = typeResult;
    }

    return {
      exit: false
    };
  });

  walker.visit(rootItem);
  return result;
}
