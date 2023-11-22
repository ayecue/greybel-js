import { Debugger, DefaultType, VM } from 'greybel-interpreter';

export default class GrebyelPseudoDebugger extends Debugger {
  debug() {
    return DefaultType.Void;
  }

  getBreakpoint(_vm: VM): boolean {
    return false;
  }

  interact(_vm: VM) {}
}
