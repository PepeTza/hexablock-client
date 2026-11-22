import type { IClock, ILogger, LogContext } from '../ports/logger';
import type { IUseCase } from '../use-cases/use-case';

/**
 * Allowlist describing which fields of a use case's input and resolved output
 * may be written to the log (decision 22).
 *
 * Supplied in the composition root where the concrete types are known. Any
 * omitted projection causes that payload to be skipped so secrets such as
 * passwords or tokens never reach logs by default.
 */
export interface UseCaseLogDescription<TInput, TOutput> {
  readonly input?: (input: TInput) => LogContext;
  readonly output?: (output: Awaited<TOutput>) => LogContext;
}

/**
 * Decorator (AOP without libraries, ADR-06, RNF-04, HU11): wraps any
 * `IUseCase` with a secure-by-default allowlist.
 *
 * Without `describe`, only the use case name, `durationMs` and (on failure)
 * the error message are logged. `describe` is supplied by the composition root
 * so passwords and tokens are never logged (decision 22).
 *
 * Works identically for synchronous (`ApplyMoveUseCase`) and asynchronous
 * (`StartGameUseCase`, `FinishGameUseCase`) use cases.
 */
export class LoggingUseCaseDecorator<TInput, TOutput> implements IUseCase<
  TInput,
  TOutput
> {
  constructor(
    private readonly name: string,
    private readonly wrapped: IUseCase<TInput, TOutput>,
    private readonly logger: ILogger,
    private readonly clock: IClock,
    private readonly describe?: UseCaseLogDescription<TInput, TOutput>,
  ) {}

  execute(input: TInput): TOutput {
    const startedAt = this.clock.now();
    let result: TOutput;
    try {
      result = this.wrapped.execute(input);
    } catch (error) {
      this.logError(input, startedAt, error);
      throw error;
    }

    if (isPromiseLike(result)) {
      return result.then(
        (resolved) => {
          // Safe cast: once resolved, the promise's value matches Awaited<TOutput>.
          this.logSuccess(input, resolved as Awaited<TOutput>, startedAt);
          return resolved;
        },
        (error: unknown) => {
          this.logError(input, startedAt, error);
          throw error;
        },
      ) as TOutput;
    }

    // Safe cast: for a synchronous use case, Awaited<TOutput> equals TOutput.
    this.logSuccess(input, result as Awaited<TOutput>, startedAt);
    return result;
  }

  private logSuccess(
    input: TInput,
    output: Awaited<TOutput>,
    startedAt: number,
  ): void {
    const context: Record<string, unknown> = {
      useCase: this.name,
      durationMs: this.clock.now() - startedAt,
    };
    if (this.describe?.input) {
      context.input = this.describe.input(input);
    }
    if (this.describe?.output) {
      context.output = this.describe.output(output);
    }
    this.logger.info(`${this.name} executed`, context);
  }

  private logError(input: TInput, startedAt: number, error: unknown): void {
    const context: Record<string, unknown> = {
      useCase: this.name,
      durationMs: this.clock.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
    if (this.describe?.input) {
      context.input = this.describe.input(input);
    }
    this.logger.error(`${this.name} failed`, context);
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
