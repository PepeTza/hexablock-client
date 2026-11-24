import type { Board } from '../../engine/board/board';
import type { GameOutcome } from '../../engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { ICoord } from '../../engine/geometry/coord';
import type { FitState, PieceId } from './fit-state';

export interface FitMove<TCoord extends ICoord> {
  readonly pieceId: PieceId;
  readonly anchor: TCoord;
  readonly rotationSteps?: number;
}

/** Template Method: place a pending piece and check exact coverage (RN-02, RN-15). */
export class FitRules<TCoord extends ICoord> extends BaseGameRules<
  PieceId,
  TCoord,
  FitMove<TCoord>,
  FitState<TCoord>,
  void
> {
  protected validate(
    board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
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
    board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
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
    _board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
  ): Resolved<FitState<TCoord>, void> {
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
    board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
  ): GameOutcome | null {
    const allPiecesPlaced = state.pendingPieces.length === 0;
    return allPiecesPlaced &&
      board.shape.coords.every((cell) => !board.isEmpty(cell))
      ? 'victory'
      : null;
  }

  private placementCells(
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
  ): TCoord[] | undefined {
    const entry = state.pendingPieces.find(({ id }) => id === move.pieceId);
    return entry?.piece.rotate(move.rotationSteps ?? 0).cellsAt(move.anchor);
  }
}
