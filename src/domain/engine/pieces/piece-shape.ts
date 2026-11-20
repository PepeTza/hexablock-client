import type { IBoardGeometry } from '../geometry/board-geometry';
import type { ICoord } from '../geometry/coord';
import type { IPlanarRotation } from '../geometry/planar-rotation';

/**
 * What a piece needs from its grid: neighbours (to check that its cells are
 * joined), translation (to place it) and planar rotation (to turn it).
 * `HexGeometry` provides all three.
 */
export type PieceGeometry<TCoord extends ICoord> = IBoardGeometry<TCoord> &
  IPlanarRotation<TCoord>;

/**
 * Value object: one shape of the piece catalog (glossary: Piece catalog), such
 * as a straight line of three cells.
 *
 * Its cells are relative to the shape itself, not to a board: the origin of
 * the geometry is the cell the piece turns around (its centre of rotation),
 * so it must be one of the cells. `Piece` turns the shape and places it on a
 * board.
 *
 * Built only through `of`, which checks the shape (RN-03): at least one cell,
 * no repeated cell, the origin among them and every cell joined to the others
 * by a side. Every `PieceShape` that exists is therefore valid.
 */
export class PieceShape<TCoord extends ICoord> {
  private constructor(
    readonly id: string,
    readonly cells: readonly TCoord[],
    readonly geometry: PieceGeometry<TCoord>,
  ) {}

  static of<TCoord extends ICoord>(
    id: string,
    cells: Iterable<TCoord>,
    geometry: PieceGeometry<TCoord>,
  ): PieceShape<TCoord> {
    if (id.trim() === '') {
      throw new RangeError('A piece shape needs a non-empty id');
    }
    const list = [...cells];
    if (list.length === 0) {
      throw new RangeError(`Piece shape ${id} needs at least one cell`);
    }
    const keys = new Set(list.map(String));
    if (keys.size !== list.length) {
      throw new RangeError(`Piece shape ${id} repeats a cell`);
    }
    if (!keys.has(String(geometry.origin))) {
      throw new RangeError(
        `Piece shape ${id} must include the origin ${String(geometry.origin)}, its centre of rotation`,
      );
    }
    if (!isConnected(list, keys, geometry)) {
      throw new RangeError(
        `The cells of piece shape ${id} must be joined by their sides (RN-03)`,
      );
    }
    return new PieceShape(id, Object.freeze(list), geometry);
  }

  /** Number of cells. */
  get size(): number {
    return this.cells.length;
  }

  /**
   * Whether `other` is this shape turned by some number of rotation steps,
   * wherever it sits on the grid. A mirror image is a different shape: pieces
   * never flip (RN-03). The ids are not compared.
   */
  isRotationOf(other: PieceShape<TCoord>): boolean {
    if (other.size !== this.size) {
      return false;
    }
    const otherKeys = new Set(other.cells.map(String));
    const target = other.cells[0];
    if (target === undefined) {
      return false;
    }
    for (let steps = 0; steps < this.geometry.rotationSteps; steps++) {
      const turned = this.cells.map((cell) =>
        this.geometry.rotate(cell, steps),
      );
      // Some turned cell must land on the first cell of `other`: try each
      // one, move the whole turned shape so that it does, and compare.
      for (const start of turned) {
        const moved = turned.map((cell) =>
          this.geometry.translate(cell, start, target),
        );
        if (moved.every((cell) => otherKeys.has(String(cell)))) {
          return true;
        }
      }
    }
    return false;
  }
}

/** Whether every cell can be reached from the first one through neighbours. */
function isConnected<TCoord extends ICoord>(
  cells: readonly TCoord[],
  keys: ReadonlySet<string>,
  geometry: IBoardGeometry<TCoord>,
): boolean {
  const first = cells[0];
  if (first === undefined) {
    return false;
  }
  const reached = new Set([String(first)]);
  const pending = [first];
  for (let cell = pending.pop(); cell !== undefined; cell = pending.pop()) {
    for (const neighbour of geometry.neighbours(cell)) {
      const key = String(neighbour);
      if (keys.has(key) && !reached.has(key)) {
        reached.add(key);
        pending.push(neighbour);
      }
    }
  }
  return reached.size === keys.size;
}
