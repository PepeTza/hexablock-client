import { Board } from '../../engine/board/board';
import type { BoardShape } from '../../engine/board/board-shape';
import { GameEngine } from '../../engine/game/game-engine';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import type { Piece } from '../../engine/pieces/piece';
import { FitRules, type FitMove } from './fit-rules';
import type { FitState, PieceId } from './fit-state';

/** Starts a Fit session from a typed figure and pieces resolved from the catalog. */
export function startFitGame(
  figure: BoardShape<HexCoord>,
  pieces: readonly Piece<HexCoord>[],
): GameEngine<PieceId, HexCoord, FitMove, FitState> {
  return GameEngine.start({
    board: new Board<PieceId, HexCoord>(figure, new HexGeometry()),
    state: {
      score: 0,
      moveCount: 0,
      pendingPieces: pieces.map((piece, id) => ({ id, piece })),
    },
    // Placements do not award points; RN-18 scores a completed level.
    rules: new FitRules({ pointsFor: () => 0 }),
    seed: null,
  });
}
