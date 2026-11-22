import type { IPrototype } from '../state/prototype';

/**
 * Strategy: where a variant gets the pieces, stacks or tiles it offers to the
 * player (RF-04). Replacing a `FixedPieceSource` (Hexa Fit levels, tests) with
 * a `RandomPieceSource` (seeded random pools) or a variant-specific source
 * changes neither the rules contract nor `GameEngine`.
 *
 * Prototype (`IPrototype`): `clone()` returns an independent copy at the same
 * point in the sequence, so a `Snapshot` can keep the source inside the game
 * state and move previews (CU-03) and undo (RN-31) never advance the source
 * of the active game.
 */
export interface IPieceSource<TPiece> extends IPrototype<IPieceSource<TPiece>> {
  /** The next piece, or `null` when a finite source has no pieces left. */
  next(): TPiece | null;

  /** Draws up to `count` pieces in order (fewer if a finite source runs out). */
  draw(count: number): TPiece[];

  /** Whether at least one more piece can be drawn. */
  hasNext(): boolean;

  /** An independent copy positioned at the same point in the source. */
  clone(): IPieceSource<TPiece>;
}

/** Validates that a `draw(count)` argument is a non-negative integer. */
export function assertDrawCount(count: number): void {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Draw count must be a non-negative integer: ${count}`);
  }
}
