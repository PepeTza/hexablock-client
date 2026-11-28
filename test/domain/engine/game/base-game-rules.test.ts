import { Board } from '@domain/engine/board/board';
import { BoardShape } from '@domain/engine/board/board-shape';
import type { GameOutcome } from '@domain/engine/events/domain-event';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { HexGeometry } from '@domain/engine/hex/hex-geometry';
import type { IScoringPolicy } from '@domain/engine/scoring/scoring-policy';
import {
  BaseGameRules,
  type Resolved,
} from '@domain/engine/game/base-game-rules';
import type { GameState } from '@domain/engine/game/game-state';

// A variant that records the order in which the template calls its steps.
type Move = { cell: HexCoord };
type Resolution = { placed: number };

class SpyRules extends BaseGameRules<
  number,
  HexCoord,
  Move,
  GameState,
  Resolution
> {
  constructor(
    readonly calls: string[],
    scoring: IScoringPolicy<Resolution>,
  ) {
    super(scoring);
  }

  protected validate(): string | null {
    this.calls.push('validate');
    return null;
  }

  protected apply(board: Board<number, HexCoord>, _: GameState, move: Move) {
    this.calls.push('apply');
    board.place(move.cell, 1);
  }

  protected resolve(
    _: Board<number, HexCoord>,
    state: GameState,
  ): Resolved<GameState, Resolution> {
    this.calls.push('resolve');
    return { state, resolution: { placed: 1 } };
  }

  protected evaluateEnd(): GameOutcome | null {
    this.calls.push('evaluateEnd');
    return null;
  }
}

describe('BaseGameRules', () => {
  const geometry = new HexGeometry();

  it('should_call_steps_in_order_when_playing', () => {
    // Arrange
    const calls: string[] = [];
    const scoring: IScoringPolicy<Resolution> = {
      pointsFor: () => {
        calls.push('score');
        return 0;
      },
    };
    const rules = new SpyRules(calls, scoring);
    const board = new Board<number, HexCoord>(
      BoardShape.ofRadius(geometry, 1),
      geometry,
    );

    // Act
    rules.play(board, { score: 0, moveCount: 0 }, { cell: HexCoord.ORIGIN });

    // Assert
    expect(calls).toEqual([
      'validate',
      'apply',
      'resolve',
      'score',
      'evaluateEnd',
    ]);
  });
});
