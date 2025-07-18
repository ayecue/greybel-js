class ConfigurationManager {
  private _config: Record<string, any>;

  constructor() {
    this._config = {
      fileExtensions: ['gs', 'ms', 'src']
    };
  }

  public set(key: string, value: any): void {
    this._config[key] = value;
  }

  public get<T>(key: string): T {
    return this._config[key];
  }
}

export const configurationManager = new ConfigurationManager();
