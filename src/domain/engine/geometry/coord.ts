/**
 * Value object: the position of a cell, as two integers that the board
 * geometry interprets. On the hex board they are axial coordinates `q, r`
 * (see `HexGeometry`); `s = -q - r` is the third cube coordinate, derived.
 *
 * Two coords with the same `q` and `r` are the same position: compare them
 * with `equals`, or use `toString` as a key in a `Map` or `Set`.
 */
export class Coord {
  static readonly ORIGIN = new Coord(0, 0);

  readonly q: number;
  readonly r: number;

  constructor(q: number, r: number) {
    if (!Number.isInteger(q) || !Number.isInteger(r)) {
      throw new RangeError(`Coord components must be integers: (${q}, ${r})`);
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

  equals(other: Coord): boolean {
    return this.q === other.q && this.r === other.r;
  }

  toString(): string {
    return `${this.q},${this.r}`;
  }
}
