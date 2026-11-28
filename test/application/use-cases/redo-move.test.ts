import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import { CommandHistory } from '@domain/engine/commands/command-history';
import type { GameOutcome } from '@domain/engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '@domain/engine/game/base-game-rules';
import { GameEngine } from '@domain/engine/game/game-engine';
import type { GameState } from '@domain/engine/game/game-state';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';

import { LoggingCommandServiceDecorator } from '@application/aspects/logging-use-case-decorator';
import type { Either } from '@application/common/either';
import type { IClock, ILogger, LogContext } from '@application/ports/logger';
import { RedoMoveUseCase } from '@application/use-cases/redo-move';

function expectRight<T>(outcome: Either<Error, T>): T {
  if (outcome.isLeft()) {
    throw outcome.value;
  }
  return outcome.value;
}

type NumberMove = { cell: HexCoord; value: number };

class NumberRules extends BaseGameRules<
  number,
  HexCoord,
  NumberMove,
  GameState,
  number
> {
  constructor() {
    super({ pointsFor: (value) => value });
  }

  protected validate(
    board: Board<number, HexCoord>,
    _: GameState,
    move: NumberMove,
  ): string | null {
    return board.isEmpty(move.cell) ? null : 'taken';
  }

  protected apply(
    board: Board<number, HexCoord>,
    _: GameState,
    move: NumberMove,
  ): void {
    board.place(move.cell, move.value);
  }

  protected resolve(
    _: Board<number, HexCoord>,
    state: GameState,
    move: NumberMove,
  ): Resolved<GameState, number> {
    return { state, resolution: move.value };
  }

  protected evaluateEnd(): GameOutcome | null {
    return null;
  }
}

const geometry = new HexGeometry();

function startEngine(history?: CommandHistory<NumberMove>) {
  return GameEngine.start({
    board: new Board<number, HexCoord>(
      BoardShape.ofRadius(geometry, 1),
      geometry,
    ),
    state: { score: 0, moveCount: 0 },
    rules: new NumberRules(),
    seed: 42,
    history,
  });
}

describe('RedoMoveUseCase', () => {
  it('should_redo_undone_move_and_return_reapplied_state_when_redo_is_available', () => {
    // Arrange
    const engine = startEngine(CommandHistory.unlimited());
    engine.applyMove({ cell: HexCoord.ORIGIN, value: 5 });
    engine.resolutionDone();
    engine.applyMove({ cell: new HexCoord(1, 0), value: 3 });
    engine.resolutionDone();
    engine.undo();
    const useCase = new RedoMoveUseCase();

    // Act
    const output = expectRight(useCase.execute({ gameId: 'hexa-fit', engine }));

    // Assert
    expect(output).toEqual({
      redone: true,
      state: { score: 8, moveCount: 2 },
      status: 'playing',
      canUndo: true,
      canRedo: false,
    });
  });

  it('should_return_redone_false_when_redo_stack_is_empty_or_cleared_by_new_move_or_not_playing', () => {
    // Arrange
    const useCase = new RedoMoveUseCase();
    const emptyEngine = startEngine(CommandHistory.unlimited());

    const clearedEngine = startEngine(CommandHistory.unlimited());
    clearedEngine.applyMove({ cell: HexCoord.ORIGIN, value: 5 });
    clearedEngine.resolutionDone();
    clearedEngine.undo();
    clearedEngine.applyMove({ cell: new HexCoord(1, 0), value: 2 });
    clearedEngine.resolutionDone();

    const pausedEngine = startEngine(CommandHistory.unlimited());
    pausedEngine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
    pausedEngine.resolutionDone();
    pausedEngine.undo();
    pausedEngine.pause();

    // Act
    const onEmpty = expectRight(
      useCase.execute({
        gameId: 'hexa-fit',
        engine: emptyEngine,
      }),
    );
    const afterNewMove = expectRight(
      useCase.execute({
        gameId: 'hexa-fit',
        engine: clearedEngine,
      }),
    );
    const whilePaused = expectRight(
      useCase.execute({
        gameId: 'hexa-fit',
        engine: pausedEngine,
      }),
    );

    // Assert
    expect(onEmpty).toEqual({
      redone: false,
      state: { score: 0, moveCount: 0 },
      status: 'playing',
      canUndo: false,
      canRedo: false,
    });
    expect(afterNewMove).toEqual({
      redone: false,
      state: { score: 2, moveCount: 1 },
      status: 'playing',
      canUndo: true,
      canRedo: false,
    });
    expect(whilePaused).toEqual({
      redone: false,
      state: { score: 0, moveCount: 0 },
      status: 'paused',
      canUndo: false,
      canRedo: false,
    });
  });

  it('should_log_only_allow_listed_fields_when_wrapped_with_logging_decorator', () => {
    // Arrange
    const entries: { level: string; message: string; context?: LogContext }[] =
      [];
    const logger: ILogger = {
      info: (message, context) =>
        entries.push({ level: 'info', message, context }),
      warn: (message, context) =>
        entries.push({ level: 'warn', message, context }),
      error: (message, context) =>
        entries.push({ level: 'error', message, context }),
    };
    let time = 200;
    const clock: IClock = {
      now: () => {
        time += 7;
        return time;
      },
    };
    const engine = startEngine(CommandHistory.unlimited());
    engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
    engine.resolutionDone();
    engine.undo();
    const decorated = new LoggingCommandServiceDecorator(
      'RedoMoveUseCase',
      new RedoMoveUseCase(),
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId }),
        output: (o) => ({
          redone: o.redone,
          status: o.status,
          canUndo: o.canUndo,
          canRedo: o.canRedo,
        }),
      },
    );

    // Act
    const output = expectRight(
      decorated.execute({ gameId: 'hexa-fit', engine }),
    );

    // Assert
    expect(output.redone).toBe(true);
    expect(entries).toEqual([
      {
        level: 'info',
        message: 'RedoMoveUseCase executed',
        context: {
          useCase: 'RedoMoveUseCase',
          durationMs: 7,
          input: { gameId: 'hexa-fit' },
          output: {
            redone: true,
            status: 'playing',
            canUndo: true,
            canRedo: false,
          },
        },
      },
    ]);
  });
});
