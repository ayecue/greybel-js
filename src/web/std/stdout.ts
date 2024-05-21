import { PrintOptions } from 'greybel-interpreter';

export class StdoutCanvas {
  print(
    message: string,
    { appendNewLine = true, replace = false }: Partial<PrintOptions> = {}
  ) {
    globalThis.postMessage({
      type: 'print',
      message,
      appendNewLine,
      replace
    });
  }

  clear() {
    globalThis.postMessage({
      type: 'clear'
    });
  }

  write(message: string) {
    globalThis.postMessage({
      type: 'append-last',
      message
    });
  }

  updateLast(message: string) {
    globalThis.postMessage({
      type: 'update-last',
      message
    });
  }

  input(message: string) {
    globalThis.postMessage({
      type: 'input',
      message
    });
  }
}

export class StdoutText {
  target: HTMLElement;
  textNodes: HTMLSpanElement[];

  constructor(target: any) {
    this.target = target;
    this.textNodes = [];
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

    while ((item = lines.shift()) !== undefined) {
      const node = me.addLine(item);
      subMessages.push(node);
    }

    if (lastLine !== undefined) {
      subMessages.push(me.addLine(lastLine!));
    }

    me.textNodes.push(...subMessages);
    me.target.scrollTop = me.target.scrollHeight;
  }

  updateLast(value: string) {
    const me = this;
    const index = me.textNodes.length - 1;

    if (index >= 0) {
      me.textNodes[index].innerHTML = '';
    }

    me.write(value);
  }

  replace(value: string) {
    const me = this;
    let index = me.textNodes.length - 1;

    for (; index >= 0; index--) {
      const node = me.textNodes.pop();
      me.target.removeChild(node);
    }

    if (index >= 0) {
      me.textNodes[index].innerHTML = '';
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
