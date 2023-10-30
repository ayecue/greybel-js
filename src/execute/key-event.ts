import { KeyCode } from 'greybel-gh-mock-intrinsics';
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
      return create(KeyCode.Enter, 'Enter');
    case NodeJSKey.Escape:
      return create(KeyCode.Escape, 'Escape');
    case NodeJSKey.Space:
      return create(KeyCode.Space, 'Space');
    case NodeJSKey.Tab:
      return create(KeyCode.Tab, 'Tab');
    case NodeJSKey.Left:
      return create(KeyCode.LeftArrow, 'ArrowLeft');
    case NodeJSKey.Up:
      return create(KeyCode.UpArrow, 'ArrowUp');
    case NodeJSKey.Right:
      return create(KeyCode.RightArrow, 'ArrowRight');
    case NodeJSKey.Down:
      return create(KeyCode.DownArrow, 'ArrowDown');
    case NodeJSKey.Backspace:
      return create(KeyCode.Backspace, 'Backspace');
    case NodeJSKey.Insert:
      return create(KeyCode.Insert, 'Insert');
    case NodeJSKey.Home:
      return create(KeyCode.Home, 'Home');
    case NodeJSKey.End:
      return create(KeyCode.End, 'End');
    case NodeJSKey.PageDown:
      return create(KeyCode.PageDown, 'PageDown');
    case NodeJSKey.PageUp:
      return create(KeyCode.PageUp, 'PageUp');
    case NodeJSKey.Delete:
      return create(KeyCode.Delete, 'Delete');
    case NodeJSKey.F1:
      return create(KeyCode.F1, 'F1');
    case NodeJSKey.F2:
      return create(KeyCode.F2, 'F2');
    case NodeJSKey.F3:
      return create(KeyCode.F3, 'F3');
    case NodeJSKey.F4:
      return create(KeyCode.F4, 'F4');
    case NodeJSKey.F5:
      return create(KeyCode.F5, 'F5');
    case NodeJSKey.F6:
      return create(KeyCode.F6, 'F6');
    case NodeJSKey.F7:
      return create(KeyCode.F7, 'F7');
    case NodeJSKey.F8:
      return create(KeyCode.F8, 'F8');
    case NodeJSKey.F9:
      return create(KeyCode.F9, 'F9');
    case NodeJSKey.F10:
      return create(KeyCode.F10, 'F10');
    case NodeJSKey.F11:
      return create(KeyCode.F11, 'F11');
    case NodeJSKey.F12:
      return create(KeyCode.F12, 'F12');
    default: {
      const char = nodeJSKeyEvent.sequence;
      const charCode = char.charCodeAt(0);
      const code = nodeJSKeyEvent.name || char;
      return { charCode, code };
    }
  }
}
