import { Board } from '../../engine/board/board';
import type { BoardShape } from '../../engine/board/board-shape';
import { CommandHistory } from '../../engine/commands/command-history';
import { GameEngine } from '../../engine/game/game-engine';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import type { Piece } from '../../engine/pieces/piece';
import type { ICoord } from '../../engine/geometry/coord';
import type { FinishedGameSummary } from '../../progress/progress-model';
import { completedFitScore, type FitScoreConfig } from './fit-progress-model';
import { FitRules, type FitMove } from './fit-rules';
import type { FitState, PieceId } from './fit-state';

/** Starts a Fit session from a typed figure and pieces resolved from the catalog. */
export function startFitGame(
  figure: BoardShape<HexCoord>,
  pieces: readonly Piece<HexCoord>[],
): GameEngine<PieceId, HexCoord, FitMove<HexCoord>, FitState<HexCoord>> {
  return GameEngine.start({
    board: new Board<PieceId, HexCoord>(figure, new HexGeometry()),
    state: {
      score: 0,
      moveCount: 0,
      pendingPieces: pieces.map((piece, id) => ({ id, piece })),
    },
    // Placements do not award points; RN-18 scores a completed level.
    rules: new FitRules<HexCoord>({ pointsFor: () => 0 }),
    seed: null,
    history: CommandHistory.unlimited<FitMove<HexCoord>>(),
  });
}

/** Domain policy: score a completed Fit session using its active play time (RN-18). */
export function summarizeFitVictory<TCoord extends ICoord>(
  game: Pick<
    GameEngine<PieceId, TCoord, FitMove<TCoord>, FitState<TCoord>>,
    'board' | 'state' | 'outcome'
  >,
  levelId: string,
  durationMs: number,
  scoreConfig?: FitScoreConfig,
): FinishedGameSummary | null {
  if (game.outcome !== 'victory') return null;

  // A catalog piece can cover several cells. Count each placed ID only once.
  const placed = new Set<PieceId>();
  for (const coord of game.board.shape.coords) {
    const pieceId = game.board.cellAt(coord);
    if (pieceId !== undefined) placed.add(pieceId);
  }
  const { moveCount } = game.state;
  return {
    gameId: 'hexa-fit',
    levelId,
    reason: 'victory',
    score: completedFitScore(moveCount, placed.size, durationMs, scoreConfig),
    moveCount,
    durationMs,
    seed: null,
  };
}
