import { Either } from '../common/either';
import type { AsyncCommandService, CommandService } from './use-case';

describe('CommandService', () => {
  it('should_reject_a_third_generic_when_typing_a_command_service', async () => {
    // Arrange: the left side is always `Error`, as taught in class (D-23).
    const sync: CommandService<string, number> = {
      execute: (command) => Either.right(command.length),
    };
    const async: AsyncCommandService<string, number> = {
      execute: (command) => Promise.resolve(Either.right(command.length)),
    };
    // @ts-expect-error CommandService takes only TCommand and TResult
    const withThirdGeneric: CommandService<string, number, RangeError> = sync;

    // Act
    const syncLength = sync.execute('hexa');
    const asyncLength = await async.execute('hexa');

    // Assert
    expect(syncLength.isRight() && syncLength.value).toBe(4);
    expect(asyncLength.isRight() && asyncLength.value).toBe(4);
    expect(withThirdGeneric).toBe(sync);
  });
});
