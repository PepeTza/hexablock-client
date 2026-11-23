import type { Either } from '../common/either';

/**
 * Common synchronous contract for application services and use cases
 * (Mark Seemann, Dependency Injection Principles, Practices, and Patterns,
 * Ch. 10), extended with `Either<TError, TResult>` so AOP decorators
 * (`<<aspect>>` Logging, ExceptionHandling, Authorization; ADR-06, RNF-04)
 * compose around `execute(command)` without type casting or throwing.
 */
export interface CommandService<
  TCommand,
  TResult = void,
  TError extends Error = Error,
> {
  execute(command: TCommand): Either<TError, TResult>;
}

/**
 * Asynchronous counterpart of `CommandService` for use cases that talk to
 * asynchronous ports (repositories, network, storage). Keeping sync and
 * async contracts distinct avoids runtime `Promise` inspection and type casts
 * in AOP decorators.
 */
export interface AsyncCommandService<
  TCommand,
  TResult = void,
  TError extends Error = Error,
> {
  execute(command: TCommand): Promise<Either<TError, TResult>>;
}
