/**
 * Contract for any cell position on a board, independent of dimension or cell
 * shape (2D axial, 2D square, 3D cube, etc.).
 *
 * The board, shapes and pieces index cells in `Map` and `Set` via `key()`, so
 * two instances representing the same position must return the same string.
 * Unlike `toString()`, no object inherits `key()` from `Object.prototype`, so
 * the compiler forces every coordinate type to implement it. Keeping only
 * `key()` satisfies ISP: methods such as `equals` stay on concrete coordinate
 * value objects that need them.
 *
 * Coordinates stay opaque outside each `IBoardGeometry` implementation
 * (RNF-14).
 */
export interface ICoord {
  key(): string;
}
