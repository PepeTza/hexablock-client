import { Either } from '../common/either';
import type {
  AsyncCommandService,
  CommandService,
} from '../use-cases/use-case';

/**
 * Decorator (`<<aspect>>`, Mark Seemann Ch. 10, ADR-06, RNF-04): catches
 * unexpected exceptions thrown by a synchronous `CommandService` or its ports
 * and converts them into `Either.left(Error)` so callers always receive an
 * explicit `Either` instead of handling raw exceptions.
 */
export class ExceptionHandlingCommandServiceDecorator<
  TCommand,
  TResult = void,
> implements CommandService<TCommand, TResult, Error> {
  constructor(private readonly decorate: CommandService<TCommand, TResult>) {}

  execute(command: TCommand): Either<Error, TResult> {
    try {
      return this.decorate.execute(command);
    } catch (error) {
      return Either.left(toError(error));
    }
  }
}

/**
 * Decorator (`<<aspect>>`, Mark Seemann Ch. 10, ADR-06, RNF-04): asynchronous
 * counterpart converting unexpected rejections from infrastructure ports into
 * `Either.left(Error)`.
 */
export class AsyncExceptionHandlingCommandServiceDecorator<
  TCommand,
  TResult = void,
> implements AsyncCommandService<TCommand, TResult, Error> {
  constructor(
    private readonly decorate: AsyncCommandService<TCommand, TResult>,
  ) {}

  async execute(command: TCommand): Promise<Either<Error, TResult>> {
    try {
      return await this.decorate.execute(command);
    } catch (error) {
      return Either.left(toError(error));
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
