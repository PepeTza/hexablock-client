import type { Board } from '../../engine/board/board';
import type { GameOutcome } from '../../engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { ICoord } from '../../engine/geometry/coord';
import type { FitState, IFitPiece, PieceId } from './fit-state';

export type FitMove<TCoord extends ICoord> = { readonly pieceId: PieceId } & (
  | {
      readonly kind?: 'place';
      readonly anchor: TCoord;
      readonly rotationSteps?: number;
    }
  | { readonly kind: 'relocate'; readonly anchor: TCoord }
  | { readonly kind: 'remove' }
  | { readonly kind: 'rotate'; readonly rotationSteps: number }
);

type FitPlacement<TCoord extends ICoord> = {
  readonly entry: IFitPiece<TCoord>;
  readonly anchor: TCoord | null;
};

/** Template Method: edit a Fit piece and check exact coverage (RN-14 to RN-17). */
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
    const current = findPiece(state, move.pieceId);
    if (move.kind === undefined || move.kind === 'place') {
      if (!current || current.anchor !== null)
        return 'The piece is not pending';
    } else if (
      !current ||
      (move.kind !== 'rotate' && current.anchor === null)
    ) {
      return 'The piece is not available for this action';
    }
    if (
      'rotationSteps' in move &&
      move.rotationSteps !== undefined &&
      !Number.isInteger(move.rotationSteps)
    ) {
      return 'Rotation must be a whole number of steps';
    }
    const next = this.nextPlacement(state, move);
    if (
      move.kind === 'relocate' &&
      current.anchor?.key() === move.anchor.key()
    ) {
      return 'The piece is already at that position';
    }
    const cells =
      next.anchor === null ? [] : next.entry.piece.cellsAt(next.anchor);
    if (cells.some((cell) => !board.contains(cell))) {
      return 'A piece cell is outside the figure';
    }
    if (
      cells.some((cell) => {
        const occupant = board.cellAt(cell);
        return occupant !== undefined && occupant !== move.pieceId;
      })
    ) {
      return 'A piece cell overlaps a placed piece';
    }
    return null;
  }

  protected apply(
    board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
  ): void {
    const current = state.placedPieces.find(({ id }) => id === move.pieceId);
    if (current !== undefined) {
      for (const cell of current.piece.cellsAt(current.anchor))
        board.remove(cell);
    }
    const next = this.nextPlacement(state, move);
    if (next.anchor !== null) {
      for (const cell of next.entry.piece.cellsAt(next.anchor))
        board.place(cell, move.pieceId);
    }
  }

  protected resolve(
    _board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
  ): Resolved<FitState<TCoord>, void> {
    const { entry, anchor } = this.nextPlacement(state, move);
    const pendingPieces = state.pendingPieces.filter(
      ({ id }) => id !== move.pieceId,
    );
    const placedPieces = state.placedPieces.filter(
      ({ id }) => id !== move.pieceId,
    );
    if (anchor === null) {
      pendingPieces.push(entry);
      pendingPieces.sort((a, b) => a.id - b.id);
    } else {
      placedPieces.push({ ...entry, anchor });
    }
    return {
      state: { ...state, pendingPieces, placedPieces },
      resolution: undefined,
    };
  }

  protected countsAsMove(move: FitMove<TCoord>): boolean {
    return move.kind !== 'remove' && move.kind !== 'rotate';
  }

  protected evaluateEnd(
    board: Board<PieceId, TCoord>,
    state: FitState<TCoord>,
  ): GameOutcome | null {
    return state.pendingPieces.length === 0 &&
      board.shape.coords.every((cell) => !board.isEmpty(cell))
      ? 'victory'
      : null;
  }

  private nextPlacement(
    state: FitState<TCoord>,
    move: FitMove<TCoord>,
  ): FitPlacement<TCoord> {
    const current = findPiece(state, move.pieceId);
    if (!current) throw new Error('A validated move must refer to a Fit piece');
    const steps = 'rotationSteps' in move ? move.rotationSteps : undefined;
    return {
      entry:
        steps === undefined
          ? current.entry
          : {
              id: current.entry.id,
              piece: current.entry.piece.rotate(steps),
            },
      anchor:
        move.kind === 'remove'
          ? null
          : 'anchor' in move
            ? move.anchor
            : current.anchor,
    };
  }
}

function findPiece<TCoord extends ICoord>(
  state: FitState<TCoord>,
  pieceId: PieceId,
): FitPlacement<TCoord> | null {
  const pending = state.pendingPieces.find(({ id }) => id === pieceId);
  if (pending !== undefined) return { entry: pending, anchor: null };
  const placed = state.placedPieces.find(({ id }) => id === pieceId);
  return placed === undefined
    ? null
    : { entry: { id: placed.id, piece: placed.piece }, anchor: placed.anchor };
}
