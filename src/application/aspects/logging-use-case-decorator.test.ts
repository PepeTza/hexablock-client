import type { IGameSession } from '@domain/engine/game/variant-factory';

import { Either } from '../common/either';
import type { IClock, ILogger, LogContext } from '../ports/logger';
import { type ApplyMoveInput, ApplyMoveUseCase } from '../use-cases/apply-move';
import type { AsyncCommandService } from '../use-cases/use-case';
import {
  AsyncLoggingCommandServiceDecorator,
  LoggingCommandServiceDecorator,
} from './logging-use-case-decorator';

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
      return { kind: 'applied', points: pointsPerMove, pendingOutcome: null };
    },
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
}

describe('LoggingCommandServiceDecorator', () => {
  it('should_log_only_name_and_duration_when_no_describe_is_given', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([100, 112]);
    const decorated = new LoggingCommandServiceDecorator(
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
    const outcome = decorated.execute(input);

    // Assert
    expect(outcome.isRight()).toBe(true);
    if (outcome.isRight()) {
      expect(outcome.value.state).toEqual({ score: 10, moveCount: 1 });
    }
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      level: 'info',
      message: 'ApplyMoveUseCase executed',
      context: {
        useCase: 'ApplyMoveUseCase',
        durationMs: 12,
      },
    });
  });

  it('should_log_no_trace_of_password_when_input_contains_password_and_no_describe', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 25, 30, 48]);
    type LoginInput = { username: string; password: string };
    const loginOk = new AsyncLoggingCommandServiceDecorator<
      LoginInput,
      { token: string }
    >(
      'LoginUseCase',
      {
        execute: () => Promise.resolve(Either.right({ token: 'tok-123' })),
      },
      logger,
      clock,
    );
    const loginFail = new AsyncLoggingCommandServiceDecorator<
      LoginInput,
      { token: string }
    >(
      'LoginUseCase',
      {
        execute: () =>
          Promise.resolve(Either.left(new Error('Invalid credentials'))),
      },
      logger,
      clock,
    );
    const credentials: LoginInput = { username: 'ana', password: 'hunter2' };

    // Act
    const okOutcome = await loginOk.execute(credentials);
    const failOutcome = await loginFail.execute(credentials);

    // Assert
    expect(okOutcome.isRight()).toBe(true);
    expect(failOutcome.isLeft()).toBe(true);
    expect(entries).toHaveLength(2);
    const logged = JSON.stringify(entries);
    expect(logged).not.toContain('hunter2');
    expect(logged).not.toContain('password');
    expect(logged).not.toContain('tok-123');
  });

  it('should_log_only_described_fields_when_describe_is_given_for_a_sync_command_service', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([100, 112]);
    const decorated = new LoggingCommandServiceDecorator(
      'ApplyMoveUseCase',
      new ApplyMoveUseCase<string>(),
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId, move: i.move }),
        output: (o) => ({ kind: o.result.kind, status: o.status }),
      },
    );
    const input: ApplyMoveInput<string> = {
      gameId: 'hexa-lines',
      engine: createStubSession(10),
      move: 'place-a',
    };

    // Act
    const outcome = decorated.execute(input);

    // Assert
    expect(outcome.isRight()).toBe(true);
    if (outcome.isRight()) {
      expect(outcome.value.state).toEqual({ score: 10, moveCount: 1 });
    }
    expect(entries).toHaveLength(1);
    expect(entries[0]?.context).toEqual({
      useCase: 'ApplyMoveUseCase',
      durationMs: 12,
      input: { gameId: 'hexa-lines', move: 'place-a' },
      output: { kind: 'applied', status: 'playing' },
    });
  });

  it('should_log_described_output_when_async_command_service_returns_right', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([500, 540]);
    const asyncService: AsyncCommandService<
      { gameId: string },
      { ok: boolean }
    > = {
      execute: () => Promise.resolve(Either.right({ ok: true })),
    };
    const decorated = new AsyncLoggingCommandServiceDecorator(
      'StartGameUseCase',
      asyncService,
      logger,
      clock,
      {
        output: (o) => ({ ok: o.ok }),
      },
    );

    // Act
    const outcome = await decorated.execute({ gameId: 'hexa-fit' });

    // Assert
    expect(outcome.isRight()).toBe(true);
    if (outcome.isRight()) {
      expect(outcome.value).toEqual({ ok: true });
    }
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      level: 'info',
      message: 'StartGameUseCase executed',
      context: {
        useCase: 'StartGameUseCase',
        output: { ok: true },
        durationMs: 40,
      },
    });
  });

  it('should_log_only_message_and_duration_when_service_returns_left_without_describe', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 14, 20, 29]);
    const syncFailing = new LoggingCommandServiceDecorator<string>(
      'SyncUseCase',
      {
        execute: () => Either.left(new Error('sync boom')),
      },
      logger,
      clock,
    );
    const asyncFailing = new AsyncLoggingCommandServiceDecorator<string>(
      'AsyncUseCase',
      {
        execute: () => Promise.resolve(Either.left(new Error('async boom'))),
      },
      logger,
      clock,
    );

    // Act
    const syncOutcome = syncFailing.execute('in-1');
    const asyncOutcome = await asyncFailing.execute('in-2');

    // Assert
    expect(syncOutcome.isLeft()).toBe(true);
    expect(asyncOutcome.isLeft()).toBe(true);
    expect(entries).toEqual([
      {
        level: 'error',
        message: 'SyncUseCase failed',
        context: {
          useCase: 'SyncUseCase',
          durationMs: 4,
          error: 'sync boom',
        },
      },
      {
        level: 'error',
        message: 'AsyncUseCase failed',
        context: {
          useCase: 'AsyncUseCase',
          durationMs: 9,
          error: 'async boom',
        },
      },
    ]);
  });

  it('should_log_described_input_when_service_returns_left_or_throws_unexpectedly', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 16, 20, 25, 30, 38]);
    const leftReturning = new AsyncLoggingCommandServiceDecorator<
      { gameId: string; secret: string },
      { ok: boolean }
    >(
      'StartGameUseCase',
      {
        execute: () => Promise.resolve(Either.left(new Error('level missing'))),
      },
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId }),
        output: (o) => ({ ok: o.ok }),
      },
    );
    const syncThrowing = new LoggingCommandServiceDecorator<string>(
      'SyncThrow',
      {
        execute: () => {
          throw new Error('raw sync failure');
        },
      },
      logger,
      clock,
    );
    const asyncThrowing = new AsyncLoggingCommandServiceDecorator<string>(
      'AsyncThrow',
      {
        execute: () => Promise.reject(new Error('unexpected reject')),
      },
      logger,
      clock,
    );

    // Act & Assert
    const outcome = await leftReturning.execute({
      gameId: 'hexa-sort',
      secret: 'do-not-log',
    });
    expect(outcome.isLeft()).toBe(true);
    expect(() => syncThrowing.execute('in-1')).toThrow('raw sync failure');
    await expect(asyncThrowing.execute('in-2')).rejects.toThrow(
      'unexpected reject',
    );
    expect(entries[0]).toEqual({
      level: 'error',
      message: 'StartGameUseCase failed',
      context: {
        useCase: 'StartGameUseCase',
        durationMs: 6,
        error: 'level missing',
        input: { gameId: 'hexa-sort' },
      },
    });
    expect(entries[1]?.context).toMatchObject({ error: 'raw sync failure' });
    expect(entries[2]?.context).toMatchObject({ error: 'unexpected reject' });
  });

  it('should_log_apply_move_for_different_variants_when_wrapped_with_same_decorator', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 13, 20, 25]);
    const decorated = new LoggingCommandServiceDecorator(
      'ApplyMoveUseCase',
      new ApplyMoveUseCase<string>(),
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId, move: i.move }),
      },
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
    expect(entries[0]?.context).toEqual({
      useCase: 'ApplyMoveUseCase',
      durationMs: 3,
      input: { gameId: 'hexa-lines', move: 'drop-piece' },
    });
    expect(entries[1]?.context).toEqual({
      useCase: 'ApplyMoveUseCase',
      durationMs: 5,
      input: { gameId: 'hexa-merge', move: 'slide-east' },
    });
  });
});
