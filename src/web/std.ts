import { OperationContext } from 'greybel-interpreter';
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

  waitForInput(ctx: OperationContext): Promise<void> {
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
            ctx.processState.removeListener('exit', onExit);
            target.removeEventListener('keydown', handler);
            resolve();
          }
        }
      };

      ctx.processState.once('exit', onExit);
      target.addEventListener('keydown', handler);
    });
  }

  waitForKeyPress(ctx: OperationContext): Promise<KeyboardEvent> {
    const me = this;
    const target = me.target;

    return new Promise((resolve) => {
      const onExit = () => {
        target.removeEventListener('keydown', handler);
        resolve(null);
      };
      const handler = (evt: KeyboardEvent) => {
        ctx.processState.removeListener('exit', onExit);
        target.removeEventListener('keydown', handler);
        resolve(evt);
      };

      ctx.processState.once('exit', onExit);
      target.addEventListener('keydown', handler);
    });
  }
}

export class Stdout {
  target: HTMLElement;
  textNodes: HTMLSpanElement[];
  previousIndex: number;

  constructor(target: any) {
    this.target = target;
    this.textNodes = [];
    this.previousIndex = 0;
  }

  addLine(message: string) {
    const me = this;
    const node = document.createElement('span');

    node.classList.add('line');
    node.innerHTML = message;
    me.target.appendChild(node);

    return node;
  }

  write(value: string) {
    const me = this;
    const lines = value.split('\n');
    const firstLine = lines.shift();
    const lastLine = lines.pop();
    const subMessages: HTMLSpanElement[] = [];
    let item;

    if (firstLine !== undefined) {
      if (me.textNodes.length === 0) {
        subMessages.push(me.addLine(firstLine));
      } else {
        const lastNode = me.textNodes[me.textNodes.length - 1];
        lastNode.innerHTML += firstLine;
      }
    }

    while ((item = lines.shift())) {
      const node = me.addLine(item);
      subMessages.push(node);
    }

    if (lastLine !== undefined) {
      subMessages.push(me.addLine(lastLine!));
    }

    me.previousIndex = me.textNodes.length;

    me.textNodes.push(...subMessages);
    me.target.scrollTop = me.target.scrollHeight;
  }

  updateLast(value: string) {
    const me = this;

    for (
      let index = me.textNodes.length - 1;
      index >= me.previousIndex;
      index--
    ) {
      const node = me.textNodes.pop();
      me.target.removeChild(node);
    }

    me.write(value);
  }

  clear() {
    const me = this;
    const target = me.target;
    me.textNodes = [];
    target.innerHTML = '';
    target.scrollTop = target.scrollHeight;
  }
}
