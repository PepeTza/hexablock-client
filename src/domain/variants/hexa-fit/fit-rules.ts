import type { GameOutcome } from '../../engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import type { FitState, PieceId } from './fit-state';

export interface FitMove {
  readonly pieceId: PieceId;
  readonly anchor: HexCoord;
  readonly rotationSteps?: number;
}

/** Template Method: place a pending piece and check exact coverage (RN-02, RN-15). */
export class FitRules extends BaseGameRules<
  PieceId,
  HexCoord,
  FitMove,
  FitState,
  void
> {
  protected validate(
    board: HexBoard<PieceId>,
    state: FitState,
    move: FitMove,
  ): string | null {
    if (
      move.rotationSteps !== undefined &&
      !Number.isInteger(move.rotationSteps)
    ) {
      return 'Rotation must be a whole number of steps';
    }
    const cells = this.placementCells(state, move);
    if (cells === undefined) {
      return 'The piece is not pending';
    }
    if (cells.some((cell) => !board.contains(cell))) {
      return 'A piece cell is outside the figure';
    }
    if (cells.some((cell) => !board.isEmpty(cell))) {
      return 'A piece cell overlaps a placed piece';
    }
    return null;
  }

  protected apply(
    board: HexBoard<PieceId>,
    state: FitState,
    move: FitMove,
  ): void {
    const cells = this.placementCells(state, move);
    if (cells === undefined) {
      throw new Error('A validated move must refer to a pending piece');
    }
    for (const cell of cells) {
      board.place(cell, move.pieceId);
    }
  }

  protected resolve(
    _board: HexBoard<PieceId>,
    state: FitState,
    move: FitMove,
  ): Resolved<FitState, void> {
    return {
      state: {
        ...state,
        pendingPieces: state.pendingPieces.filter(
          ({ id }) => id !== move.pieceId,
        ),
      },
      resolution: undefined,
    };
  }

  protected evaluateEnd(
    board: HexBoard<PieceId>,
    state: FitState,
  ): GameOutcome | null {
    const allPiecesPlaced = state.pendingPieces.length === 0;
    return allPiecesPlaced &&
      board.shape.coords.every((cell) => !board.isEmpty(cell))
      ? 'victory'
      : null;
  }

  private placementCells(
    state: FitState,
    move: FitMove,
  ): HexCoord[] | undefined {
    const entry = state.pendingPieces.find(({ id }) => id === move.pieceId);
    return entry?.piece.rotate(move.rotationSteps ?? 0).cellsAt(move.anchor);
  }
}
