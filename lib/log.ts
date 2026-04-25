export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

export function log(level: LogLevel, message: string, context?: LogContext): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ?? {}),
  });
  const sink =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(line);
}
