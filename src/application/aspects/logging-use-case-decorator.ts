import type { IClock, ILogger } from '../ports/logger';
import type { IUseCase } from '../use-cases/use-case';

/**
 * Decorator (AOP without libraries, ADR-06, RNF-04, HU11): wraps any
 * `IUseCase` to log its name, input, output (or error) and execution duration
 * measured through `IClock`, without modifying the use case or any variant.
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
          this.logSuccess(input, resolved, startedAt);
          return resolved;
        },
        (error: unknown) => {
          this.logError(input, startedAt, error);
          throw error;
        },
      ) as TOutput;
    }

    this.logSuccess(input, result, startedAt);
    return result;
  }

  private logSuccess(input: TInput, output: unknown, startedAt: number): void {
    this.logger.info(`${this.name} executed`, {
      useCase: this.name,
      input,
      output,
      durationMs: this.clock.now() - startedAt,
    });
  }

  private logError(input: TInput, startedAt: number, error: unknown): void {
    this.logger.error(`${this.name} failed`, {
      useCase: this.name,
      input,
      durationMs: this.clock.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
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
