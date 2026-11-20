import type { ICoord } from '../geometry/coord';

/**
 * Value object: the position of a cell on a hexagonal board, as axial
 * coordinates `q, r` (see `HexGeometry`); `s = -q - r` is the third cube
 * coordinate, derived.
 *
 * Two `HexCoord` instances with the same `q` and `r` represent the same
 * position: compare them with `equals`, or use `toString` as a key in a `Map`
 * or `Set`.
 */
export class HexCoord implements ICoord {
  static readonly ORIGIN = new HexCoord(0, 0);

  readonly q: number;
  readonly r: number;

  constructor(q: number, r: number) {
    if (!Number.isInteger(q) || !Number.isInteger(r)) {
      throw new RangeError(
        `HexCoord components must be integers: (${q}, ${r})`,
      );
    }
    // Arithmetic such as `-r` can produce -0, which Jest and Object.is
    // tell apart from 0; storing 0 keeps equality and keys consistent.
    this.q = q === 0 ? 0 : q;
    this.r = r === 0 ? 0 : r;
  }

  get s(): number {
    const s = -this.q - this.r;
    return s === 0 ? 0 : s;
  }

  equals(other: ICoord): boolean {
    return (
      other instanceof HexCoord && this.q === other.q && this.r === other.r
    );
  }

  toString(): string {
    return `${this.q},${this.r}`;
  }
}
