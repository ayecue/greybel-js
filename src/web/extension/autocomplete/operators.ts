import { Operator as GreybelOperators } from 'greybel-core/dist/types/operators.js';
import { Operator } from 'miniscript-core';
import Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

import { PseudoCompletionItem } from '../helper/vs.js';

export const AVAILABLE_OPERATORS = [
  Operator.Plus,
  Operator.Asterik,
  Operator.Minus,
  Operator.Slash,
  Operator.Power,
  Operator.Modulo,
  Operator.LessThan,
  Operator.GreaterThan,
  Operator.LessThanOrEqual,
  Operator.GreaterThanOrEqual,
  Operator.NotEqual,
  Operator.Equal,
  Operator.AddShorthand,
  Operator.SubtractShorthand,
  Operator.MultiplyShorthand,
  Operator.DivideShorthand,
  GreybelOperators.BitwiseAnd,
  GreybelOperators.BitwiseOr,
  GreybelOperators.LeftShift,
  GreybelOperators.RightShift,
  GreybelOperators.UnsignedRightShift,
  Operator.Assign,
  Operator.Reference
] as const;

export const getAvailableOperators = (
  range: Monaco.Range
): PseudoCompletionItem[] => {
  return AVAILABLE_OPERATORS.map((label: string) => {
    return new PseudoCompletionItem({
      label,
      kind: 11,
      insertText: label,
      range
    });
  });
};
