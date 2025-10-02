import { KeyCode } from 'greybel-gh-mock-intrinsics';
import { KeyEvent } from 'greybel-interpreter';

export interface InternalKeyEvent {
  sequence: string;
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  code?: string;
}

export enum InternalKey {
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

export function transformInternalKeyEventToKeyEvent(
  InternalKeyEvent: InternalKeyEvent
): KeyEvent {
  const create = (keyCode: number, code: string): KeyEvent => ({
    keyCode,
    code
  });

  switch (InternalKeyEvent.name) {
    case InternalKey.Return:
      return create(KeyCode.Enter, 'Enter');
    case InternalKey.Escape:
      return create(KeyCode.Escape, 'Escape');
    case InternalKey.Space:
      return create(KeyCode.Space, 'Space');
    case InternalKey.Tab:
      return create(KeyCode.Tab, 'Tab');
    case InternalKey.Left:
      return create(KeyCode.LeftArrow, 'ArrowLeft');
    case InternalKey.Up:
      return create(KeyCode.UpArrow, 'ArrowUp');
    case InternalKey.Right:
      return create(KeyCode.RightArrow, 'ArrowRight');
    case InternalKey.Down:
      return create(KeyCode.DownArrow, 'ArrowDown');
    case InternalKey.Backspace:
      return create(KeyCode.Backspace, 'Backspace');
    case InternalKey.Insert:
      return create(KeyCode.Insert, 'Insert');
    case InternalKey.Home:
      return create(KeyCode.Home, 'Home');
    case InternalKey.End:
      return create(KeyCode.End, 'End');
    case InternalKey.PageDown:
      return create(KeyCode.PageDown, 'PageDown');
    case InternalKey.PageUp:
      return create(KeyCode.PageUp, 'PageUp');
    case InternalKey.Delete:
      return create(KeyCode.Delete, 'Delete');
    case InternalKey.F1:
      return create(KeyCode.F1, 'F1');
    case InternalKey.F2:
      return create(KeyCode.F2, 'F2');
    case InternalKey.F3:
      return create(KeyCode.F3, 'F3');
    case InternalKey.F4:
      return create(KeyCode.F4, 'F4');
    case InternalKey.F5:
      return create(KeyCode.F5, 'F5');
    case InternalKey.F6:
      return create(KeyCode.F6, 'F6');
    case InternalKey.F7:
      return create(KeyCode.F7, 'F7');
    case InternalKey.F8:
      return create(KeyCode.F8, 'F8');
    case InternalKey.F9:
      return create(KeyCode.F9, 'F9');
    case InternalKey.F10:
      return create(KeyCode.F10, 'F10');
    case InternalKey.F11:
      return create(KeyCode.F11, 'F11');
    case InternalKey.F12:
      return create(KeyCode.F12, 'F12');
    default: {
      const char = InternalKeyEvent.sequence;
      const charCode = char.charCodeAt(0);
      const code = InternalKeyEvent.name || char;
      return { charCode, code };
    }
  }
}

export function transformInternalKeyEventToToIngameKeyCodeValue(
  InternalKeyEvent: InternalKeyEvent
): string {
  switch (InternalKeyEvent.name) {
    case InternalKey.Return:
      return '';
    case InternalKey.Escape:
      return 'Escape';
    case InternalKey.Space:
      return String.fromCharCode(32);
    case InternalKey.Tab:
      return 'Tab';
    case InternalKey.Left:
      return 'LeftArrow';
    case InternalKey.Up:
      return 'UpArrow';
    case InternalKey.Right:
      return 'RightArrow';
    case InternalKey.Down:
      return 'DownArrow';
    case InternalKey.Backspace:
      return 'Backspace';
    case InternalKey.Insert:
      return 'Insert';
    case InternalKey.Home:
      return 'Home';
    case InternalKey.End:
      return 'End';
    case InternalKey.PageDown:
      return 'PageDown';
    case InternalKey.PageUp:
      return 'PageUp';
    case InternalKey.Delete:
      return 'Delete';
    case InternalKey.F1:
      return 'F1';
    case InternalKey.F2:
      return 'F2';
    case InternalKey.F3:
      return 'F3';
    case InternalKey.F4:
      return 'F4';
    case InternalKey.F5:
      return 'F5';
    case InternalKey.F6:
      return 'F6';
    case InternalKey.F7:
      return 'F7';
    case InternalKey.F8:
      return 'F8';
    case InternalKey.F9:
      return 'F9';
    case InternalKey.F10:
      return 'F10';
    case InternalKey.F11:
      return 'F11';
    case InternalKey.F12:
      return 'F12';
    default: {
      const char = InternalKeyEvent.sequence;
      return char;
    }
  }
}
