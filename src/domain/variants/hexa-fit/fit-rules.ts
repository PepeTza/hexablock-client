import type { GameOutcome } from '../../engine/events/domain-event';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import type { FitState, IFitPiece, PieceId } from './fit-state';

export type FitMove = { readonly pieceId: PieceId } & (
  | {
      readonly kind?: 'place';
      readonly anchor: HexCoord;
      readonly rotationSteps?: number;
    }
  | { readonly kind: 'relocate'; readonly anchor: HexCoord }
  | { readonly kind: 'remove' }
  | { readonly kind: 'rotate'; readonly rotationSteps: number }
);

type FitPlacement = {
  readonly entry: IFitPiece;
  readonly anchor: HexCoord | null;
};

/** Template Method: edit a Fit piece and check exact coverage (RN-14 to RN-17). */
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
    if (move.kind === 'relocate' && current.anchor?.equals(move.anchor)) {
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
    board: HexBoard<PieceId>,
    state: FitState,
    move: FitMove,
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
    _board: HexBoard<PieceId>,
    state: FitState,
    move: FitMove,
  ): Resolved<FitState, void> {
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

  protected countsAsMove(move: FitMove): boolean {
    return move.kind !== 'remove' && move.kind !== 'rotate';
  }

  protected evaluateEnd(
    board: HexBoard<PieceId>,
    state: FitState,
  ): GameOutcome | null {
    return state.pendingPieces.length === 0 &&
      board.shape.coords.every((cell) => !board.isEmpty(cell))
      ? 'victory'
      : null;
  }

  private nextPlacement(state: FitState, move: FitMove): FitPlacement {
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

function findPiece(state: FitState, pieceId: PieceId): FitPlacement | null {
  const pending = state.pendingPieces.find(({ id }) => id === pieceId);
  if (pending !== undefined) return { entry: pending, anchor: null };
  const placed = state.placedPieces.find(({ id }) => id === pieceId);
  return placed === undefined
    ? null
    : { entry: { id: placed.id, piece: placed.piece }, anchor: placed.anchor };
}
