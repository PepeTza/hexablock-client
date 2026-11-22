import type { IGameSession } from '@domain/engine/game/variant-factory';

import type { IClock, ILogger, LogContext } from '../ports/logger';
import { type ApplyMoveInput, ApplyMoveUseCase } from '../use-cases/apply-move';
import type { IUseCase } from '../use-cases/use-case';
import { LoggingUseCaseDecorator } from './logging-use-case-decorator';

interface LogRecord {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: LogContext;
}

function createFakeLogger() {
  const entries: LogRecord[] = [];
  const logger: ILogger = {
    info: (message, context) =>
      entries.push({ level: 'info', message, context }),
    warn: (message, context) =>
      entries.push({ level: 'warn', message, context }),
    error: (message, context) =>
      entries.push({ level: 'error', message, context }),
  };
  return { logger, entries };
}

function createStepClock(timestamps: readonly number[]): IClock {
  let index = 0;
  return {
    now: () => {
      const value = timestamps[index] ?? timestamps[timestamps.length - 1] ?? 0;
      index += 1;
      return value;
    },
  };
}

function createStubSession(pointsPerMove: number): IGameSession<string> {
  let score = 0;
  let moveCount = 0;
  return {
    seed: 1,
    get state() {
      return { score, moveCount };
    },
    status: 'playing',
    outcome: null,
    subscribe: () => () => undefined,
    applyMove: () => {
      score += pointsPerMove;
      moveCount += 1;
    },
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
}

describe('LoggingUseCaseDecorator', () => {
  it('should_log_input_output_and_duration_when_wrapping_a_sync_use_case', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([100, 112]);
    const decorated = new LoggingUseCaseDecorator(
      'ApplyMoveUseCase',
      new ApplyMoveUseCase<string>(),
      logger,
      clock,
    );
    const input: ApplyMoveInput<string> = {
      gameId: 'hexa-lines',
      engine: createStubSession(10),
      move: 'place-a',
    };

    // Act
    const output = decorated.execute(input);

    // Assert
    expect(output.state).toEqual({ score: 10, moveCount: 1 });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: 'info',
      message: 'ApplyMoveUseCase executed',
      context: {
        useCase: 'ApplyMoveUseCase',
        input,
        output,
        durationMs: 12,
      },
    });
  });

  it('should_log_apply_move_for_different_variants_when_wrapped_with_same_decorator', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 13, 20, 25]);
    const decorated = new LoggingUseCaseDecorator(
      'ApplyMoveUseCase',
      new ApplyMoveUseCase<string>(),
      logger,
      clock,
    );

    // Act
    decorated.execute({
      gameId: 'hexa-lines',
      engine: createStubSession(10),
      move: 'drop-piece',
    });
    decorated.execute({
      gameId: 'hexa-merge',
      engine: createStubSession(4),
      move: 'slide-east',
    });

    // Assert
    expect(entries).toHaveLength(2);
    expect(entries[0]?.context).toMatchObject({
      useCase: 'ApplyMoveUseCase',
      durationMs: 3,
      input: { gameId: 'hexa-lines', move: 'drop-piece' },
    });
    expect(entries[1]?.context).toMatchObject({
      useCase: 'ApplyMoveUseCase',
      durationMs: 5,
      input: { gameId: 'hexa-merge', move: 'slide-east' },
    });
  });

  it('should_log_input_output_and_duration_when_wrapping_an_async_use_case', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([500, 540]);
    const asyncUseCase: IUseCase<
      { gameId: string },
      Promise<{ ok: boolean }>
    > = {
      execute: () => Promise.resolve({ ok: true }),
    };
    const decorated = new LoggingUseCaseDecorator(
      'StartGameUseCase',
      asyncUseCase,
      logger,
      clock,
    );

    // Act
    const output = await decorated.execute({ gameId: 'hexa-fit' });

    // Assert
    expect(output).toEqual({ ok: true });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: 'info',
      message: 'StartGameUseCase executed',
      context: {
        useCase: 'StartGameUseCase',
        input: { gameId: 'hexa-fit' },
        output: { ok: true },
        durationMs: 40,
      },
    });
  });

  it('should_log_error_and_rethrow_when_wrapped_use_case_throws_or_rejects', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 14, 20, 29]);
    const syncFailing = new LoggingUseCaseDecorator<string, void>(
      'SyncUseCase',
      {
        execute: () => {
          throw new Error('sync boom');
        },
      },
      logger,
      clock,
    );
    const asyncFailing = new LoggingUseCaseDecorator<string, Promise<void>>(
      'AsyncUseCase',
      {
        execute: () => Promise.reject(new Error('async boom')),
      },
      logger,
      clock,
    );

    // Act & Assert
    expect(() => syncFailing.execute('in-1')).toThrow('sync boom');
    await expect(asyncFailing.execute('in-2')).rejects.toThrow('async boom');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      level: 'error',
      context: { useCase: 'SyncUseCase', durationMs: 4, error: 'sync boom' },
    });
    expect(entries[1]).toMatchObject({
      level: 'error',
      context: { useCase: 'AsyncUseCase', durationMs: 9, error: 'async boom' },
    });
  });
});
