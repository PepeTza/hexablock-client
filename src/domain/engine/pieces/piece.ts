import type { ICoord } from '../geometry/coord';
import type { PieceShape } from './piece-shape';

/**
 * Value object: a shape of the catalog in a given rotation (glossary: Piece).
 * Hexa Lines may hand it out already turned (D-07) and Hexa Fit lets the
 * player turn it (RN-14).
 *
 * Immutable: `rotate` returns a new piece, so a preview (CU-03) can try a
 * rotation without changing the piece being dragged.
 *
 * The piece only computes cells. Whether they fit on the board (inside and
 * free, RN-02) is decided by the rules of each variant.
 */
export class Piece<TCoord extends ICoord> {
  /** Rotation steps applied to the shape, from 0 to `rotationSteps - 1`. */
  readonly rotation: number;

  private constructor(
    readonly shape: PieceShape<TCoord>,
    rotation: number,
  ) {
    this.rotation = rotation;
  }

  /**
   * `shape` turned by `rotation` steps (0 by default); any integer is
   * accepted and reduced to one full turn.
   */
  static of<TCoord extends ICoord>(
    shape: PieceShape<TCoord>,
    rotation = 0,
  ): Piece<TCoord> {
    if (!Number.isInteger(rotation)) {
      throw new RangeError(`Rotation steps must be an integer: ${rotation}`);
    }
    return new Piece(shape, mod(rotation, shape.geometry.rotationSteps));
  }

  /** A new piece turned `steps` more steps clockwise (negative: counter-clockwise). */
  rotate(steps: number): Piece<TCoord> {
    if (!Number.isInteger(steps)) {
      throw new RangeError(`Rotation steps must be an integer: ${steps}`);
    }
    return Piece.of(this.shape, this.rotation + steps);
  }

  /** The cells of the turned shape, still relative to its centre. */
  cells(): TCoord[] {
    const geometry = this.shape.geometry;
    return this.shape.cells.map((cell) => geometry.rotate(cell, this.rotation));
  }

  /**
   * The cells of the board the piece would cover with its centre on `anchor`:
   * first turned around the centre, then moved from the origin to `anchor`.
   */
  cellsAt(anchor: TCoord): TCoord[] {
    const geometry = this.shape.geometry;
    return this.cells().map((cell) =>
      geometry.translate(cell, geometry.origin, anchor),
    );
  }
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
