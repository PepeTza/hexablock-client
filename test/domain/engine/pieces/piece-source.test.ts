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
import { SeededRandom } from '@domain/engine/random/seeded-random';
import type { IScoringPolicy } from '@domain/engine/scoring/scoring-policy';
import { FixedPieceSource } from '@domain/engine/pieces/fixed-piece-source';
import type { IPieceSource } from '@domain/engine/pieces/piece-source';
import { RandomPieceSource } from '@domain/engine/pieces/random-piece-source';

// Minimal test variant that places its current piece from an injected
// `IPieceSource` and draws the next one after each move, proving both
// `IPieceSource` and `IScoringPolicy` can be swapped without touching `GameEngine`.
type PlaceMove = { cell: HexCoord };
type TokenState = GameState & { readonly nextPiece: number | null };
type TokenResolution = { readonly placedValue: number };

class TokenRules extends BaseGameRules<
  number,
  HexCoord,
  PlaceMove,
  TokenState,
  TokenResolution
> {
  constructor(
    private readonly pieces: IPieceSource<number>,
    scoring: IScoringPolicy<TokenResolution>,
  ) {
    super(scoring);
  }

  protected validate(
    board: Board<number, HexCoord>,
    state: TokenState,
    move: PlaceMove,
  ): string | null {
    if (state.nextPiece === null) return 'no piece left';
    return board.isEmpty(move.cell) ? null : 'cell is taken';
  }

  protected apply(
    board: Board<number, HexCoord>,
    state: TokenState,
    move: PlaceMove,
  ): void {
    board.place(move.cell, state.nextPiece as number);
  }

  protected resolve(
    _: Board<number, HexCoord>,
    state: TokenState,
  ): Resolved<TokenState, TokenResolution> {
    const placedValue = state.nextPiece as number;
    return {
      state: { ...state, nextPiece: this.pieces.next() },
      resolution: { placedValue },
    };
  }

  protected evaluateEnd(
    _: Board<number, HexCoord>,
    state: TokenState,
  ): GameOutcome | null {
    return state.nextPiece === null ? 'victory' : null;
  }
}

const geometry = new HexGeometry();
const faceValue: IScoringPolicy<TokenResolution> = {
  pointsFor: (r) => r.placedValue,
};
const tripleValue: IScoringPolicy<TokenResolution> = {
  pointsFor: (r) => r.placedValue * 3,
};

function startTokenGame(
  pieces: IPieceSource<number>,
  scoring: IScoringPolicy<TokenResolution> = faceValue,
  seed: number | null = null,
) {
  return GameEngine.start({
    board: new Board<number, HexCoord>(
      BoardShape.ofRadius(geometry, 1),
      geometry,
    ),
    state: { score: 0, moveCount: 0, nextPiece: pieces.next() },
    rules: new TokenRules(pieces, scoring),
    seed,
  });
}

describe('IPieceSource and IScoringPolicy with GameEngine', () => {
  it('should_change_dealt_pieces_without_modifying_engine_when_piece_source_is_swapped', () => {
    // Arrange
    const fixed = startTokenGame(new FixedPieceSource([5, 6, 7]));
    const random = startTokenGame(
      RandomPieceSource.uniform([1, 2, 3, 4], new SeededRandom(42)),
      faceValue,
      42,
    );

    // Act
    fixed.applyMove({ cell: HexCoord.ORIGIN });
    random.applyMove({ cell: HexCoord.ORIGIN });

    // Assert
    expect(fixed.board.cellAt(HexCoord.ORIGIN)).toBe(5);
    expect(fixed.state.nextPiece).toBe(6);
    expect([1, 2, 3, 4]).toContain(random.board.cellAt(HexCoord.ORIGIN));
    expect([1, 2, 3, 4]).toContain(random.state.nextPiece);
  });

  it('should_change_score_without_modifying_engine_when_scoring_policy_is_swapped', () => {
    // Arrange
    const plain = startTokenGame(new FixedPieceSource([5, 6]), faceValue);
    const tripled = startTokenGame(new FixedPieceSource([5, 6]), tripleValue);

    // Act
    plain.applyMove({ cell: HexCoord.ORIGIN });
    tripled.applyMove({ cell: HexCoord.ORIGIN });

    // Assert
    expect(plain.state.score).toBe(5);
    expect(tripled.state.score).toBe(15);
  });
});
