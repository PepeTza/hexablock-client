import type { GameState } from '../../engine/game/game-state';
import type { ICoord } from '../../engine/geometry/coord';
import type { Piece } from '../../engine/pieces/piece';

/** Identifies one copy of a piece within a Fit session. */
export type PieceId = number;

export interface IFitPiece<TCoord extends ICoord> {
  readonly id: PieceId;
  readonly piece: Piece<TCoord>;
}

/** The board stores placed IDs; the tray holds the remaining pieces. */
export interface FitState<TCoord extends ICoord> extends GameState {
  readonly pendingPieces: readonly IFitPiece<TCoord>[];
}
