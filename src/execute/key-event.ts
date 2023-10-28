import { KeyEvent } from 'greybel-interpreter';

export interface NodeJSKeyEvent {
  sequence: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  code?: string;
}

export enum NodeJSKey {
  Return = 'return',
  Escape = 'escape',
  Space = 'space',
  Tab = 'tab',
  Up = 'up',
  Right = 'right',
  Left = 'left',
  Down = 'down',
  Backspace = 'backspace',
  Insert = 'insert',
  Home = 'home',
  End = 'end',
  PageDown = 'pagedown',
  PageUp = 'pageup',
  Delete = 'delete',
  F1 = 'f1',
  F2 = 'f2',
  F3 = 'f3',
  F4 = 'f4',
  F5 = 'f5',
  F6 = 'f6',
  F7 = 'f7',
  F8 = 'f8',
  F9 = 'f9',
  F10 = 'f10',
  F11 = 'f11',
  F12 = 'f12'
}

export function nodeJSKeyEventToKeyEvent(
  nodeJSKeyEvent: NodeJSKeyEvent
): KeyEvent {
  const create = (keyCode: number, code: string): KeyEvent => ({
    keyCode,
    code
  });

  switch (nodeJSKeyEvent.name) {
    case NodeJSKey.Return:
      return create(13, 'Enter');
    case NodeJSKey.Escape:
      return create(27, 'Escape');
    case NodeJSKey.Space:
      return create(32, 'Space');
    case NodeJSKey.Tab:
      return create(9, 'Tab');
    case NodeJSKey.Left:
      return create(37, 'ArrowLeft');
    case NodeJSKey.Up:
      return create(38, 'ArrowUp');
    case NodeJSKey.Right:
      return create(39, 'ArrowRight');
    case NodeJSKey.Down:
      return create(40, 'ArrowDown');
    case NodeJSKey.Backspace:
      return create(8, 'Backspace');
    case NodeJSKey.Insert:
      return create(45, 'Insert');
    case NodeJSKey.Home:
      return create(36, 'Home');
    case NodeJSKey.End:
      return create(35, 'End');
    case NodeJSKey.PageDown:
      return create(34, 'PageDown');
    case NodeJSKey.PageUp:
      return create(33, 'PageUp');
    case NodeJSKey.Delete:
      return create(46, 'Delete');
    case NodeJSKey.F1:
      return create(-1, 'F1');
    case NodeJSKey.F2:
      return create(-2, 'F2');
    case NodeJSKey.F3:
      return create(-3, 'F3');
    case NodeJSKey.F4:
      return create(-4, 'F4');
    case NodeJSKey.F5:
      return create(-5, 'F5');
    case NodeJSKey.F6:
      return create(-6, 'F6');
    case NodeJSKey.F7:
      return create(-7, 'F7');
    case NodeJSKey.F8:
      return create(-8, 'F8');
    case NodeJSKey.F9:
      return create(-9, 'F9');
    case NodeJSKey.F10:
      return create(-10, 'F10');
    case NodeJSKey.F11:
      return create(-11, 'F11');
    case NodeJSKey.F12:
      return create(-12, 'F12');
    default: {
      const char = nodeJSKeyEvent.sequence;
      const keyCode = char.charCodeAt(0);
      const code = nodeJSKeyEvent.name || char;
      return create(keyCode, code);
    }
  }
}
