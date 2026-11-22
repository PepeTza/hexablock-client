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
      return { kind: 'applied', points: pointsPerMove, pendingOutcome: null };
    },
    pause: () => undefined,
    resume: () => undefined,
    resolutionDone: () => undefined,
  };
}

describe('LoggingUseCaseDecorator', () => {
  it('should_log_only_name_and_duration_when_no_describe_is_given', () => {
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
    const loginOk = new LoggingUseCaseDecorator<
      LoginInput,
      Promise<{ token: string }>
    >(
      'LoginUseCase',
      {
        execute: () => Promise.resolve({ token: 'tok-123' }),
      },
      logger,
      clock,
    );
    const loginFail = new LoggingUseCaseDecorator<
      LoginInput,
      Promise<{ token: string }>
    >(
      'LoginUseCase',
      {
        execute: () => Promise.reject(new Error('Invalid credentials')),
      },
      logger,
      clock,
    );
    const credentials: LoginInput = { username: 'ana', password: 'hunter2' };

    // Act
    const output = await loginOk.execute(credentials);
    await expect(loginFail.execute(credentials)).rejects.toThrow(
      'Invalid credentials',
    );

    // Assert
    expect(output).toEqual({ token: 'tok-123' });
    expect(entries).toHaveLength(2);
    const logged = JSON.stringify(entries);
    expect(logged).not.toContain('hunter2');
    expect(logged).not.toContain('password');
    expect(logged).not.toContain('tok-123');
  });

  it('should_log_only_described_fields_when_describe_is_given_for_a_sync_use_case', () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([100, 112]);
    const decorated = new LoggingUseCaseDecorator(
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
    const output = decorated.execute(input);

    // Assert
    expect(output.state).toEqual({ score: 10, moveCount: 1 });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.context).toEqual({
      useCase: 'ApplyMoveUseCase',
      durationMs: 12,
      input: { gameId: 'hexa-lines', move: 'place-a' },
      output: { kind: 'applied', status: 'playing' },
    });
  });

  it('should_log_described_output_of_resolved_value_when_use_case_is_async', async () => {
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
      {
        output: (o) => ({ ok: o.ok }),
      },
    );

    // Act
    const output = await decorated.execute({ gameId: 'hexa-fit' });

    // Assert
    expect(output).toEqual({ ok: true });
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

  it('should_log_only_message_and_duration_when_use_case_fails_without_describe', async () => {
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
    expect(entries[0]).toEqual({
      level: 'error',
      message: 'SyncUseCase failed',
      context: {
        useCase: 'SyncUseCase',
        durationMs: 4,
        error: 'sync boom',
      },
    });
    expect(entries[1]).toEqual({
      level: 'error',
      message: 'AsyncUseCase failed',
      context: {
        useCase: 'AsyncUseCase',
        durationMs: 9,
        error: 'async boom',
      },
    });
  });

  it('should_log_described_input_when_use_case_fails_with_describe', async () => {
    // Arrange
    const { logger, entries } = createFakeLogger();
    const clock = createStepClock([10, 16]);
    const failing = new LoggingUseCaseDecorator<
      { gameId: string; secret: string },
      Promise<{ ok: boolean }>
    >(
      'StartGameUseCase',
      {
        execute: () => Promise.reject(new Error('level missing')),
      },
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId }),
        output: (o) => ({ ok: o.ok }),
      },
    );

    // Act & Assert
    await expect(
      failing.execute({ gameId: 'hexa-sort', secret: 'do-not-log' }),
    ).rejects.toThrow('level missing');
    expect(entries).toHaveLength(1);
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
