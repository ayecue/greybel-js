import {
  CustomValue,
  Debugger,
  DefaultType,
  OperationContext
} from 'greybel-interpreter';

export class GrebyelDebugger extends Debugger {
  onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>;

  constructor(
    onInteract: (dbgr: Debugger, context: OperationContext) => Promise<void>
  ) {
    super();
    this.onInteract = onInteract;
  }

  debug(..._segments: any[]): CustomValue {
    return DefaultType.Void;
  }

  interact(operationContext: OperationContext): Promise<void> {
    return this.onInteract(this, operationContext);
  }
}
