import monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { Registry } from 'vscode-textmate';

import { Themes } from './types.js';

interface Cfg {
  registry: Registry;
  monaco: typeof monaco;
  themes: Themes;
}

export class ThemeProvider {
  private themes = new Map<string, any>();
  private themeMeta;
  private registry: Registry;
  private monaco: typeof monaco;
  private currentTheme = '';

  constructor(cfg: Cfg) {
    this.registry = cfg.registry;
    this.monaco = cfg.monaco;
    this.themeMeta = cfg.themes;
  }

  public async setTheme(id?: string) {
    if (!id) return;
    if (this.themes.has(id)) {
      this.setEditorTheme(id);
      return;
    }
    const theme = await this.loadTheme(id);
    this.registry.setTheme(theme);
    this.monaco.editor.setTheme(id);
    this.injectCSS();
  }

  public setEditorTheme(id: string) {
    if (this.currentTheme !== id) {
      this.monaco.editor.setTheme(id);
    }
  }

  public async loadTheme(id: string) {
    if (this.themes.has(id)) return this.themes.get(id);
    const theme = await this.fetchTheme(id);
    this.monaco.editor.defineTheme(theme.id, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        {
          token: '',
          ...theme.settings[0]
        }
      ],
      colors: theme.colors
    });
    this.themes.set(id, theme);
    return theme;
  }

  public async fetchTheme(id: string) {
    const payload = await fetch(`${this.themeMeta[id]}`);
    const theme = await payload.json();
    const res = {
      id,
      name,
      settings: [
        ...(theme.colors
          ? [
              {
                settings: {
                  foreground: theme.colors['editor.foreground'],
                  background: theme.colors['editor.background']
                }
              }
            ]
          : []),
        ...theme.tokenColors
      ],
      colors: theme.colors
    };

    return res;
  }

  /**
   * Be sure this is done after Monaco injects its default styles so that the
   * injected CSS overrides the defaults.
   */
  public injectCSS() {
    const cssColors = this.registry.getColorMap();
    const { Color } = window.require('vs/base/common/color');
    const { TokenizationRegistry } = window.require(
      'vs/editor/common/languages'
    );
    const { generateTokensCSSForColorMap } = window.require(
      'vs/editor/common/languages/supports/tokenization'
    );
    const colorMap = cssColors.map(Color.Format.CSS.parseHex);
    // This is needed to ensure the minimap gets the right colors.
    TokenizationRegistry.setColorMap(colorMap);
    const css = generateTokensCSSForColorMap(colorMap);
    const style = this.createStyleElementForColorsCSS();
    style.innerHTML = css;
  }

  public createStyleElementForColorsCSS() {
    // We want to ensure that our <style> element appears after Monaco's so that
    // we can override some styles it inserted for the default theme.
    const style = document.createElement('style');

    // We expect the styles we need to override to be in an element with the class
    // name 'monaco-colors' based on:
    // https://github.com/microsoft/vscode/blob/f78d84606cd16d75549c82c68888de91d8bdec9f/src/vs/editor/standalone/browser/standaloneThemeServiceImpl.ts#L206-L214
    const monacoColors = document.getElementsByClassName('monaco-colors')[0];
    if (monacoColors) {
      monacoColors.parentElement?.insertBefore(style, monacoColors.nextSibling);
    } else {
      // Though if we cannot find it, just append to <head>.
      let { head } = document;
      if (head == null) {
        head = document.getElementsByTagName('head')[0];
      }
      head?.appendChild(style);
    }
    return style;
  }
}
