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

  waitForInput(): Promise<void> {
    const me = this;
    const target = me.target;
    const id = v4();

    me.queue.unshift(id);

    return new Promise((resolve) => {
      const handler = (evt: KeyboardEvent) => {
        if (evt.keyCode === 13) {
          const currentId = me.queue[0];

          if (id === currentId) {
            evt.stopImmediatePropagation();
            me.queue.shift();
            target.removeEventListener('keydown', handler);
            resolve();
          }
        }
      };

      target.addEventListener('keydown', handler);
    });
  }

  waitForKeyPress(): Promise<KeyboardEvent> {
    const me = this;
    const target = me.target;

    return new Promise((resolve) => {
      const handler = (evt: KeyboardEvent) => {
        target.removeEventListener('keydown', handler);
        resolve(evt);
      };

      target.addEventListener('keydown', handler);
    });
  }
}

export class Stdout {
  target: HTMLElement;
  textNodes: Text[][];

  constructor(target: any) {
    this.target = target;
    this.textNodes = [];
  }

  addNewLine() {
    const lineBreakNode = document.createElement('br');
    this.target.appendChild(lineBreakNode);
  }

  write(value: string) {
    const me = this;
    const lines = value.split('\n');
    const subMessages: Text[] = [];
    let item;

    while (item = lines.shift()) {
      const node = document.createTextNode(item);

      me.target.appendChild(node);
      subMessages.push(node);
      me.addNewLine();
    }

    me.textNodes.push(subMessages);
  }

  updateLast(value: string) {
    const me = this;
    const lastNodeGroup = me.textNodes[me.textNodes.length - 1];
    const lines = value.split('\n');

    for (let index = 0; index < lines.length; index++) {
      lastNodeGroup[index].textContent = lines[index];
    }
  }

  clear() {
    const me = this;
    const target = me.target;
    me.textNodes = [];
    target.innerHTML = '';
    target.scrollTop = target.scrollHeight;
  }
}
