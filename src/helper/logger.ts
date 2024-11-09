type Level = 'debug' | 'info' | 'error' | 'warn' | 'none';

export class Logger {
  logLevel: Level = 'debug';
  logLevels: Record<Level, number> = {
    debug: 0,
    info: 1,
    error: 2,
    warn: 3,
    none: 4
  };

  setLogLevel(level: Level) {
    this.logLevel = level;
  }

  isAllowed(level: Level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }

  debug(message: string) {
    if (!this.isAllowed('debug')) return;
    console.debug(message);
  }

  info(message: string) {
    if (!this.isAllowed('info')) return;
    console.log(message);
  }

  error(message: string) {
    if (!this.isAllowed('error')) return;
    console.error(message);
  }

  warn(message: string) {
    if (!this.isAllowed('warn')) return;
    console.warn(message);
  }
}

export const logger = new Logger();
