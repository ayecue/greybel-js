import { VM } from 'greybel-interpreter';
import { v4 } from 'uuid';

export class Stdin {
  target: HTMLInputElement;
  queue: string[];

  constructor(target: any) {
    this.queue = [];
    this.target = target;
  }

  enable() {
    const me = this;
    me.target.disabled = false;
  }

  disable() {
    const me = this;
    me.target.disabled = true;
  }

  focus() {
    const me = this;
    me.target.focus();
  }

  getValue() {
    const me = this;
    return me.target.value;
  }

  clear() {
    const me = this;
    me.target.value = '';
  }

  setType(type: any) {
    const me = this;
    me.target.type = type;
  }

  waitForInput(vm: VM): Promise<void> {
    const me = this;
    const target = me.target;
    const id = v4();

    me.queue.unshift(id);

    return new Promise((resolve) => {
      const onExit = () => {
        me.queue.shift();
        target.removeEventListener('keydown', handler);
        resolve();
      };
      const handler = (evt: KeyboardEvent) => {
        if (evt.keyCode === 13) {
          const currentId = me.queue[0];

          if (id === currentId) {
            evt.stopImmediatePropagation();
            me.queue.shift();
            vm.getSignal().removeListener('exit', onExit);
            target.removeEventListener('keydown', handler);
            resolve();
          }
        }
      };

      vm.getSignal().once('exit', onExit);
      target.addEventListener('keydown', handler);
    });
  }

  waitForKeyPress(vm: VM): Promise<KeyboardEvent> {
    const me = this;
    const target = me.target;

    return new Promise((resolve) => {
      const onExit = () => {
        target.removeEventListener('keydown', handler);
        resolve(null);
      };
      const handler = (evt: KeyboardEvent) => {
        vm.getSignal().removeListener('exit', onExit);
        target.removeEventListener('keydown', handler);
        resolve(evt);
      };

      vm.getSignal().once('exit', onExit);
      target.addEventListener('keydown', handler);
    });
  }
}
