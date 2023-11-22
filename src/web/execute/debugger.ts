import {
  CustomValue,
  Debugger,
  DefaultType,
  VM
} from 'greybel-interpreter';

export class GrebyelDebugger extends Debugger {
  onInteract: (dbgr: Debugger, vm: VM) => Promise<void>;

  constructor(
    onInteract: (dbgr: Debugger, vm: VM) => Promise<void>
  ) {
    super();
    this.onInteract = onInteract;
  }

  debug(..._segments: any[]): CustomValue {
    return DefaultType.Void;
  }

  interact(vm: VM): Promise<void> {
    return this.onInteract(this, vm);
  }
}
