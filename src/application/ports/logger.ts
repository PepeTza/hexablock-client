/** Structured metadata attached to a log entry. */
export type LogContext = Readonly<Record<string, unknown>>;

/**
 * Port (DIP): structured logger used by cross-cutting aspects such as
 * `LoggingUseCaseDecorator` (RNF-04) and use cases. Implemented in layer 3/4.
 */
export interface ILogger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

/**
 * Port (DIP): injectable clock returning elapsed or epoch milliseconds so
 * duration measurements stay deterministic in tests (D-19).
 */
export interface IClock {
  now(): number;
}
