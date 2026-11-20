/**
 * Contract for any cell position on a board, independent of dimension or cell
 * shape (2D axial, 2D square, 3D cube, etc.).
 *
 * The board and the pieces use `toString` as the key of a cell in a `Map` or
 * `Set`, so two instances of the same position must return the same text.
 * `equals` compares two positions directly. No engine class calls it today,
 * but it keeps this contract meaningful: every object already has a
 * `toString`, so without `equals` any value (a number, a string, any object)
 * would count as an `ICoord`. Issue #56 discusses an explicit `key()` instead.
 *
 * Coordinates stay opaque outside each `IBoardGeometry` implementation
 * (RNF-14).
 */
export interface ICoord {
  equals(other: ICoord): boolean;
  toString(): string;
}
