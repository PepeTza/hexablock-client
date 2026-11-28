import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import type { GameOutcome } from '@domain/engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '@domain/engine/game/base-game-rules';
import { GameEngine } from '@domain/engine/game/game-engine';
import type { GameState } from '@domain/engine/game/game-state';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';

import type { Either } from '@application/common/either';
import { ApplyMoveUseCase } from '@application/use-cases/apply-move';

function expectRight<T>(outcome: Either<Error, T>): T {
  if (outcome.isLeft()) {
    throw outcome.value;
  }
  return outcome.value;
}

type NumberMove = { cell: HexCoord; value: number };
type ColourMove = { cell: HexCoord; colour: 'red' | 'blue' };

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

class ColourRules extends BaseGameRules<
  'red' | 'blue',
  HexCoord,
  ColourMove,
  GameState,
  null
> {
  constructor() {
    super({ pointsFor: () => 2 });
  }

  protected validate(
    board: Board<'red' | 'blue', HexCoord>,
    _: GameState,
    move: ColourMove,
  ): string | null {
    return board.isEmpty(move.cell) ? null : 'taken';
  }

  protected apply(
    board: Board<'red' | 'blue', HexCoord>,
    _: GameState,
    move: ColourMove,
  ): void {
    board.place(move.cell, move.colour);
  }

  protected resolve(
    _: Board<'red' | 'blue', HexCoord>,
    state: GameState,
  ): Resolved<GameState, null> {
    return { state, resolution: null };
  }

  protected evaluateEnd(): GameOutcome | null {
    return null;
  }
}

/** NumberRules where the first applied move wins the game. */
class WinOnFirstMoveRules extends NumberRules {
  protected evaluateEnd(): GameOutcome | null {
    return 'victory';
  }
}

const geometry = new HexGeometry();

function startNumbers(rules: NumberRules, radius: number) {
  return GameEngine.start({
    board: new Board<number, HexCoord>(
      BoardShape.ofRadius(geometry, radius),
      geometry,
    ),
    state: { score: 0, moveCount: 0 },
    rules,
    seed: 42,
  });
}

describe('ApplyMoveUseCase', () => {
  it('should_return_rejected_result_when_the_move_is_rejected', () => {
    // Arrange
    const engine = startNumbers(new NumberRules(), 1);
    const useCase = new ApplyMoveUseCase<NumberMove>();
    useCase.execute({
      gameId: 'variant-numbers',
      engine,
      move: { cell: HexCoord.ORIGIN, value: 7 },
    });
    engine.resolutionDone();

    // Act
    const output = expectRight(
      useCase.execute({
        gameId: 'variant-numbers',
        engine,
        move: { cell: HexCoord.ORIGIN, value: 3 },
      }),
    );

    // Assert
    expect(output.result).toEqual({ kind: 'rejected', reason: 'taken' });
    expect(output.status).toBe('playing');
  });

  it('should_return_the_pending_outcome_when_the_move_ends_the_game', () => {
    // Arrange
    const engine = startNumbers(new WinOnFirstMoveRules(), 0);
    const useCase = new ApplyMoveUseCase<NumberMove>();

    // Act
    const output = expectRight(
      useCase.execute({
        gameId: 'variant-numbers',
        engine,
        move: { cell: HexCoord.ORIGIN, value: 7 },
      }),
    );

    // Assert
    expect(output.result).toEqual({
      kind: 'applied',
      points: 7,
      pendingOutcome: 'victory',
    });
  });

  it('should_delegate_move_to_engine_and_return_updated_state_when_valid', () => {
    // Arrange
    const engine = GameEngine.start({
      board: new Board<number, HexCoord>(
        BoardShape.ofRadius(geometry, 1),
        geometry,
      ),
      state: { score: 0, moveCount: 0 },
      rules: new NumberRules(),
      seed: 42,
    });
    const useCase = new ApplyMoveUseCase<NumberMove>();

    // Act
    const output = expectRight(
      useCase.execute({
        gameId: 'variant-numbers',
        engine,
        move: { cell: HexCoord.ORIGIN, value: 7 },
      }),
    );

    // Assert
    expect(output).toEqual({
      result: { kind: 'applied', points: 7, pendingOutcome: null },
      state: { score: 7, moveCount: 1 },
      status: 'resolving',
    });
  });

  it('should_work_across_multiple_variants_when_using_the_same_use_case', () => {
    // Arrange
    const numberEngine = GameEngine.start({
      board: new Board<number, HexCoord>(
        BoardShape.ofRadius(geometry, 1),
        geometry,
      ),
      state: { score: 0, moveCount: 0 },
      rules: new NumberRules(),
      seed: 1,
    });
    const colourEngine = GameEngine.start({
      board: new Board<'red' | 'blue', HexCoord>(
        BoardShape.ofRadius(geometry, 1),
        geometry,
      ),
      state: { score: 0, moveCount: 0 },
      rules: new ColourRules(),
      seed: null,
    });
    const numberUseCase = new ApplyMoveUseCase<NumberMove>();
    const colourUseCase = new ApplyMoveUseCase<ColourMove>();

    // Act
    const numberOutput = expectRight(
      numberUseCase.execute({
        gameId: 'variant-numbers',
        engine: numberEngine,
        move: { cell: HexCoord.ORIGIN, value: 5 },
      }),
    );
    const colourOutput = expectRight(
      colourUseCase.execute({
        gameId: 'variant-colours',
        engine: colourEngine,
        move: { cell: HexCoord.ORIGIN, colour: 'red' },
      }),
    );

    // Assert
    expect(numberOutput.state.score).toBe(5);
    expect(colourOutput.state.score).toBe(2);
  });
});
