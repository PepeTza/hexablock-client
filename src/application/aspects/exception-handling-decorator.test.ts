import { Either } from '../common/either';
import type {
  AsyncCommandService,
  CommandService,
} from '../use-cases/use-case';
import {
  AsyncExceptionHandlingCommandServiceDecorator,
  ExceptionHandlingCommandServiceDecorator,
} from './exception-handling-decorator';

describe('ExceptionHandlingCommandServiceDecorator', () => {
  it('should_pass_through_either_when_wrapped_sync_service_returns_normally', () => {
    // Arrange
    const inner: CommandService<string, number> = {
      execute: (cmd) => Either.right(cmd.length),
    };
    const decorated = new ExceptionHandlingCommandServiceDecorator(inner);

    // Act
    const outcome = decorated.execute('hexa');

    // Assert
    expect(outcome.isRight()).toBe(true);
    expect(
      outcome.fold(
        () => -1,
        (value) => value,
      ),
    ).toBe(4);
  });

  it('should_convert_thrown_errors_into_either_left_when_sync_service_throws', () => {
    // Arrange
    const innerError: CommandService<string, number> = {
      execute: () => {
        throw new RangeError('unexpected failure');
      },
    };
    const decoratedError = new ExceptionHandlingCommandServiceDecorator(
      innerError,
    );

    // Act
    const outcome = decoratedError.execute('cmd');

    // Assert
    expect(outcome.isLeft()).toBe(true);
    expect(
      outcome.fold(
        (err) => err.message,
        () => '',
      ),
    ).toBe('unexpected failure');
  });

  it('should_convert_rejected_promises_into_either_left_when_async_service_rejects', async () => {
    // Arrange
    const okService: AsyncCommandService<string, string> = {
      execute: (cmd) => Promise.resolve(Either.right(`hi:${cmd}`)),
    };
    const rejectingService: AsyncCommandService<string, string> = {
      execute: () => Promise.reject(new Error('network down')),
    };
    const decoratedOk = new AsyncExceptionHandlingCommandServiceDecorator(
      okService,
    );
    const decoratedFail = new AsyncExceptionHandlingCommandServiceDecorator(
      rejectingService,
    );

    // Act
    const okOutcome = await decoratedOk.execute('user');
    const failOutcome = await decoratedFail.execute('user');

    // Assert
    expect(
      okOutcome.fold(
        () => '',
        (value) => value,
      ),
    ).toBe('hi:user');
    expect(failOutcome.isLeft()).toBe(true);
    expect(
      failOutcome.fold(
        (err) => err.message,
        () => '',
      ),
    ).toBe('network down');
  });
});
