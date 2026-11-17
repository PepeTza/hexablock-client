/**
 * Contract for any cell position on a board, independent of dimension or cell
 * shape (2D axial, 2D square, 3D cube, etc.).
 *
 * The board and engine only depend on `equals` and `toString` (used as a key
 * in a `Map` or `Set`), keeping coordinate representation opaque outside each
 * `IBoardGeometry` implementation (RNF-14).
 */
export interface ICoord {
  equals(other: ICoord): boolean;
  toString(): string;
}
