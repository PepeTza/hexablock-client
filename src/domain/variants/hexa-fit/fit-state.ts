import type { GameState } from '../../engine/game/game-state';
import type { HexCoord } from '../../engine/hex/hex-coord';
import type { Piece } from '../../engine/pieces/piece';

/** Identifies one copy of a piece within a Fit session. */
export type PieceId = number;

export interface IFitPiece {
  readonly id: PieceId;
  readonly piece: Piece<HexCoord>;
}

/** The board stores placed IDs; the tray holds the remaining pieces. */
export interface FitState extends GameState {
  readonly pendingPieces: readonly IFitPiece[];
}
