import type { Either } from '../common/either';
import type { IClock, ILogger, LogContext } from '../ports/logger';
import type {
  AsyncCommandService,
  CommandService,
} from '../use-cases/use-case';

/**
 * Allowlist describing which fields of a command and its resolved result may
 * be written to the log (decision 22).
 *
 * Supplied in the composition root where concrete types are known. Any omitted
 * projection causes that payload to be skipped so secrets such as passwords or
 * tokens never reach logs by default.
 */
export interface CommandLogDescription<TCommand, TResult> {
  readonly input?: (command: TCommand) => LogContext;
  readonly output?: (result: TResult) => LogContext;
}

export type UseCaseLogDescription<TCommand, TResult> = CommandLogDescription<
  TCommand,
  TResult
>;

/**
 * Decorator (`<<aspect>>`, Mark Seemann Ch. 10, ADR-06, RNF-04, HU11): wraps
 * any synchronous `CommandService` with a secure-by-default allowlist.
 *
 * Logs `info` on `Right` and `error` on `Left` (or unexpected exceptions)
 * without type assertions (`as`).
 */
export class LoggingCommandServiceDecorator<
  TCommand,
  TResult = void,
> implements CommandService<TCommand, TResult> {
  constructor(
    private readonly name: string,
    private readonly decorate: CommandService<TCommand, TResult>,
    private readonly logger: ILogger,
    private readonly clock: IClock,
    private readonly describe?: CommandLogDescription<TCommand, TResult>,
  ) {}

  execute(command: TCommand): Either<Error, TResult> {
    const startedAt = this.clock.now();
    try {
      const outcome = this.decorate.execute(command);
      return recordOutcome(
        this.name,
        command,
        outcome,
        startedAt,
        this.logger,
        this.clock,
        this.describe,
      );
    } catch (error) {
      logError(
        this.name,
        command,
        String(error),
        startedAt,
        this.logger,
        this.clock,
        this.describe,
      );
      throw error;
    }
  }
}

/**
 * Decorator (`<<aspect>>`, Mark Seemann Ch. 10, ADR-06, RNF-04, HU11): wraps
 * any `AsyncCommandService` with a secure-by-default allowlist, avoiding runtime
 * `Promise` type casts.
 */
export class AsyncLoggingCommandServiceDecorator<
  TCommand,
  TResult = void,
> implements AsyncCommandService<TCommand, TResult> {
  constructor(
    private readonly name: string,
    private readonly decorate: AsyncCommandService<TCommand, TResult>,
    private readonly logger: ILogger,
    private readonly clock: IClock,
    private readonly describe?: CommandLogDescription<TCommand, TResult>,
  ) {}

  async execute(command: TCommand): Promise<Either<Error, TResult>> {
    const startedAt = this.clock.now();
    try {
      const outcome = await this.decorate.execute(command);
      return recordOutcome(
        this.name,
        command,
        outcome,
        startedAt,
        this.logger,
        this.clock,
        this.describe,
      );
    } catch (error) {
      logError(
        this.name,
        command,
        String(error),
        startedAt,
        this.logger,
        this.clock,
        this.describe,
      );
      throw error;
    }
  }
}

export { LoggingCommandServiceDecorator as LoggingUseCaseDecorator };

function recordOutcome<TCommand, TResult>(
  name: string,
  command: TCommand,
  outcome: Either<Error, TResult>,
  startedAt: number,
  logger: ILogger,
  clock: IClock,
  describe?: CommandLogDescription<TCommand, TResult>,
): Either<Error, TResult> {
  if (outcome.isRight()) {
    logSuccess(
      name,
      command,
      outcome.value,
      startedAt,
      logger,
      clock,
      describe,
    );
  } else {
    logError(
      name,
      command,
      outcome.value.message,
      startedAt,
      logger,
      clock,
      describe,
    );
  }
  return outcome;
}

function logSuccess<TCommand, TResult>(
  name: string,
  command: TCommand,
  result: TResult,
  startedAt: number,
  logger: ILogger,
  clock: IClock,
  describe?: CommandLogDescription<TCommand, TResult>,
): void {
  const context: Record<string, unknown> = {
    useCase: name,
    durationMs: clock.now() - startedAt,
  };
  if (describe?.input) {
    context.input = describe.input(command);
  }
  if (describe?.output) {
    context.output = describe.output(result);
  }
  logger.info(`${name} executed`, context);
}

/**
 * `error` is already text: the `Either.left` value is typed `Error`, so its
 * `message` is read directly; a thrown `unknown` is passed as `String(error)`.
 */
function logError<TCommand, TResult>(
  name: string,
  command: TCommand,
  error: string,
  startedAt: number,
  logger: ILogger,
  clock: IClock,
  describe?: CommandLogDescription<TCommand, TResult>,
): void {
  const context: Record<string, unknown> = {
    useCase: name,
    durationMs: clock.now() - startedAt,
    error,
  };
  if (describe?.input) {
    context.input = describe.input(command);
  }
  logger.error(`${name} failed`, context);
}
