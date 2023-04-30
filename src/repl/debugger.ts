import GreybelInterpreter, {
  Debugger,
  OperationContext
} from 'greybel-interpreter';

const { DefaultType } = GreybelInterpreter;

export default class GrebyelPseudoDebugger extends Debugger {
  debug() {
    return DefaultType.Void;
  }

  getBreakpoint(_operationContext: OperationContext): boolean {
    return false;
  }

  interact(_operationContext: OperationContext) {}
}
