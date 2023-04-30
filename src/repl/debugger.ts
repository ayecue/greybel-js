import { Debugger, DefaultType, OperationContext } from 'greybel-interpreter';

export default class GrebyelPseudoDebugger extends Debugger {
  debug() {
    return DefaultType.Void;
  }

  getBreakpoint(_operationContext: OperationContext): boolean {
    return false;
  }

  interact(_operationContext: OperationContext) {}
}
