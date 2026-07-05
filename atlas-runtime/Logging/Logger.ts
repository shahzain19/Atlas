export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private entries: LogEntry[] = [];
  private maxEntries: number = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(module: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, module, message, metadata);
  }

  info(module: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, module, message, metadata);
  }

  warn(module: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, module, message, metadata);
  }

  error(module: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, module, message, metadata);
  }

  private log(level: LogLevel, module: string, message: string, metadata?: Record<string, any>): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      module,
      message,
      metadata,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.print(entry);
  }

  private print(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: "\x1b[36m",
      [LogLevel.INFO]: "\x1b[32m",
      [LogLevel.WARN]: "\x1b[33m",
      [LogLevel.ERROR]: "\x1b[31m",
    };
    const reset = "\x1b[0m";
    const levelStr = LogLevel[entry.level];
    console.log(
      `${colors[entry.level]}[${levelStr}] [${entry.module}] ${entry.message}${reset}`,
      entry.metadata ? entry.metadata : ""
    );
  }

  getEntries(filter?: { level?: LogLevel; module?: string }): LogEntry[] {
    let entries = [...this.entries];
    if (filter?.level !== undefined) {
      entries = entries.filter((e) => e.level === filter.level);
    }
    if (filter?.module) {
      entries = entries.filter((e) => e.module === filter.module);
    }
    return entries;
  }

  clear(): void {
    this.entries = [];
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

export const logger = new Logger();
