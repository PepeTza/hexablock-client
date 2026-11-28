import { Either } from '@application/common/either';
import { UnexpectedError } from '@application/common/unexpected-error';
import type {
  AsyncCommandService,
  CommandService,
} from '@application/use-cases/use-case';
import {
  AsyncExceptionHandlingCommandServiceDecorator,
  ExceptionHandlingCommandServiceDecorator,
} from '@application/aspects/exception-handling-decorator';

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
    const original = new RangeError('unexpected failure');
    const innerError: CommandService<string, number> = {
      execute: () => {
        throw original;
      },
    };
    const decoratedError = new ExceptionHandlingCommandServiceDecorator(
      innerError,
    );

    // Act
    const outcome = decoratedError.execute('cmd');

    // Assert
    const error = outcome.fold(
      (err) => err,
      () => null,
    );
    expect(error).toBeInstanceOf(UnexpectedError);
    expect(error?.cause).toBe(original);
    expect(error?.message).toBe('RangeError: unexpected failure');
  });

  it('should_wrap_thrown_value_as_unexpected_error_when_sync_service_throws_a_non_error', () => {
    // Arrange
    const thrown: unknown = 'plain string failure';
    const inner: CommandService<string, number> = {
      execute: () => {
        throw thrown;
      },
    };
    const decorated = new ExceptionHandlingCommandServiceDecorator(inner);

    // Act
    const outcome = decorated.execute('cmd');

    // Assert
    const error = outcome.fold(
      (err) => err,
      () => null,
    );
    expect(error).toBeInstanceOf(UnexpectedError);
    expect(error?.cause).toBe(thrown);
    expect(error?.message).toBe('plain string failure');
  });

  it('should_convert_rejected_promises_into_either_left_when_async_service_rejects', async () => {
    // Arrange
    const okService: AsyncCommandService<string, string> = {
      execute: (cmd) => Promise.resolve(Either.right(`hi:${cmd}`)),
    };
    const original = new Error('network down');
    const rejectingService: AsyncCommandService<string, string> = {
      execute: () => Promise.reject(original),
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
    const error = failOutcome.fold(
      (err) => err,
      () => null,
    );
    expect(error).toBeInstanceOf(UnexpectedError);
    expect(error?.cause).toBe(original);
    expect(error?.message).toBe('Error: network down');
  });

  it('should_wrap_rejected_value_as_unexpected_error_when_async_service_rejects_with_a_non_error', async () => {
    // Arrange
    const rejected: unknown = 'raw async reject';
    const inner: AsyncCommandService<string, number> = {
      execute: async () => {
        await Promise.resolve();
        throw rejected;
      },
    };
    const decorated = new AsyncExceptionHandlingCommandServiceDecorator(inner);

    // Act
    const outcome = await decorated.execute('cmd');

    // Assert
    const error = outcome.fold(
      (err) => err,
      () => null,
    );
    expect(error).toBeInstanceOf(UnexpectedError);
    expect(error?.cause).toBe(rejected);
    expect(error?.message).toBe('raw async reject');
  });
});
