import type { Either } from '../common/either';

/**
 * Common synchronous contract for application services and use cases
 * (Mark Seemann, Dependency Injection Principles, Practices, and Patterns,
 * Ch. 10), extended as taught in class to return `Either<Error, TResult>`, so
 * AOP decorators (`<<aspect>>` Logging, ExceptionHandling, Authorization;
 * ADR-06, RNF-04) compose around `execute(command)` without type casting or
 * throwing.
 *
 * The same interface covers commands (`TResult = void`) and queries
 * (`TResult` is the data read), so there is no separate `QueryService`. A use
 * case may still declare a narrower `Error` subclass in its own `execute`
 * (D-23).
 */
export interface CommandService<TCommand, TResult = void> {
  execute(command: TCommand): Either<Error, TResult>;
}

/**
 * Asynchronous counterpart of `CommandService` for use cases that talk to
 * asynchronous ports (repositories, network, storage). Keeping sync and
 * async contracts distinct avoids runtime `Promise` inspection and type casts
 * in AOP decorators.
 */
export interface AsyncCommandService<TCommand, TResult = void> {
  execute(command: TCommand): Promise<Either<Error, TResult>>;
}
