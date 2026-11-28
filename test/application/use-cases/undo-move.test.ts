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
import { UndoMoveUseCase } from '@application/use-cases/undo-move';

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

describe('UndoMoveUseCase', () => {
  it('should_undo_last_move_and_return_restored_state_when_undo_is_available', () => {
    // Arrange
    const engine = startEngine(CommandHistory.unlimited());
    engine.applyMove({ cell: HexCoord.ORIGIN, value: 5 });
    engine.resolutionDone();
    engine.applyMove({ cell: new HexCoord(1, 0), value: 3 });
    engine.resolutionDone();
    const useCase = new UndoMoveUseCase();

    // Act
    const output = expectRight(useCase.execute({ gameId: 'hexa-fit', engine }));

    // Assert
    expect(output).toEqual({
      undone: true,
      state: { score: 5, moveCount: 1 },
      status: 'playing',
      canUndo: true,
      canRedo: true,
    });
  });

  it('should_return_undone_false_and_keep_state_when_nothing_can_be_undone_or_not_playing', () => {
    // Arrange
    const mergeLike = startEngine(CommandHistory.singleUndo());
    mergeLike.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
    mergeLike.resolutionDone();
    const useCase = new UndoMoveUseCase();
    const first = expectRight(
      useCase.execute({ gameId: 'hexa-merge', engine: mergeLike }),
    );

    const paused = startEngine(CommandHistory.unlimited());
    paused.applyMove({ cell: HexCoord.ORIGIN, value: 7 });
    paused.resolutionDone();
    paused.pause();

    // Act
    const secondMerge = expectRight(
      useCase.execute({
        gameId: 'hexa-merge',
        engine: mergeLike,
      }),
    );
    const whilePaused = expectRight(
      useCase.execute({
        gameId: 'hexa-fit',
        engine: paused,
      }),
    );

    // Assert
    expect(first).toEqual({
      undone: true,
      state: { score: 0, moveCount: 0 },
      status: 'playing',
      canUndo: false,
      canRedo: false,
    });
    expect(secondMerge).toEqual({
      undone: false,
      state: { score: 0, moveCount: 0 },
      status: 'playing',
      canUndo: false,
      canRedo: false,
    });
    expect(whilePaused).toEqual({
      undone: false,
      state: { score: 7, moveCount: 1 },
      status: 'paused',
      canUndo: false,
      canRedo: false,
    });
  });

  it('should_undo_move_on_baseline_disabled_variant_when_booster_grants_extra_undo', () => {
    // Arrange
    const engine = startEngine(CommandHistory.disabled());
    engine.applyMove({ cell: HexCoord.ORIGIN, value: 6 });
    engine.resolutionDone();
    const useCase = new UndoMoveUseCase();
    const beforeGrant = expectRight(
      useCase.execute({ gameId: 'hexa-lines', engine }),
    );

    // Act
    engine.grantUndo(1);
    const afterGrant = expectRight(
      useCase.execute({ gameId: 'hexa-lines', engine }),
    );

    // Assert
    expect(beforeGrant.undone).toBe(false);
    expect(afterGrant).toEqual({
      undone: true,
      state: { score: 0, moveCount: 0 },
      status: 'playing',
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
    let time = 100;
    const clock: IClock = {
      now: () => {
        time += 5;
        return time;
      },
    };
    const engine = startEngine(CommandHistory.unlimited());
    engine.applyMove({ cell: HexCoord.ORIGIN, value: 4 });
    engine.resolutionDone();
    const decorated = new LoggingCommandServiceDecorator(
      'UndoMoveUseCase',
      new UndoMoveUseCase(),
      logger,
      clock,
      {
        input: (i) => ({ gameId: i.gameId }),
        output: (o) => ({
          undone: o.undone,
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
    expect(output.undone).toBe(true);
    expect(entries).toEqual([
      {
        level: 'info',
        message: 'UndoMoveUseCase executed',
        context: {
          useCase: 'UndoMoveUseCase',
          durationMs: 5,
          input: { gameId: 'hexa-fit' },
          output: {
            undone: true,
            status: 'playing',
            canUndo: false,
            canRedo: true,
          },
        },
      },
    ]);
  });
});
