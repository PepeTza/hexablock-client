import type { Axis } from '../geometry/axis';
import type { IBoardGeometry } from '../geometry/board-geometry';
import type { ICoord } from '../geometry/coord';
import type { HexCoord } from '../geometry/hex-coord';
import type { BoardShape } from './board-shape';

/**
 * The generic board of every variant (RF-01, HU07): `Board<Color>` in Hexa
 * Lines, `Board<PieceId>` in Hexa Fit, `Board<ColorStack>` in Hexa Sort and
 * `Board<Tile>` in Hexa Merge.
 *
 * Parameterised by `TCell` (cell content) and `TCoord extends ICoord`
 * (defaulting to `HexCoord`), receiving its shape and geometry by composition.
 * It knows nothing about hexagons, 3D grids, or any variant. Which moves are
 * legal is decided by the rules of each variant, not here.
 *
 * An empty cell holds no value: `cellAt` returns `undefined`. That is why
 * `TCell` cannot be `null` or `undefined` (`NonNullable<unknown>`).
 *
 * Prototype: `clone()` returns an independent copy, used to simulate a move
 * (CU-03) and to keep the board before a move so it can be undone (CU-05).
 */
export class Board<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord = HexCoord,
> {
  private readonly cells = new Map<string, TCell>();

  constructor(
    readonly shape: BoardShape<TCoord>,
    readonly geometry: IBoardGeometry<TCoord>,
  ) {}

  /** Whether `coord` is a cell of this board. */
  contains(coord: TCoord): boolean {
    return this.shape.contains(coord);
  }

  /** The content of the cell, or `undefined` when it is empty. */
  cellAt(coord: TCoord): TCell | undefined {
    this.assertInside(coord);
    return this.cells.get(String(coord));
  }

  isEmpty(coord: TCoord): boolean {
    return this.cellAt(coord) === undefined;
  }

  /** Puts `cell` on `coord`, replacing what was there. */
  place(coord: TCoord, cell: TCell): void {
    this.assertInside(coord);
    this.cells.set(String(coord), cell);
  }

  /** Empties the cell. */
  remove(coord: TCoord): void {
    this.assertInside(coord);
    this.cells.delete(String(coord));
  }

  /** The neighbours of `coord` that are cells of this board. */
  neighbours(coord: TCoord): TCoord[] {
    return this.geometry
      .neighbours(coord)
      .filter((neighbour) => this.contains(neighbour));
  }

  /** The line through `coord` along `axis`, up to the edges of the board. */
  line(coord: TCoord, axis: Axis): TCoord[] {
    return this.geometry.line(coord, axis, (cell) => this.contains(cell));
  }

  /**
   * Every line of the board along `axis`, each once (RN-09). On a
   * free-form shape a gap splits a row into separate lines.
   */
  lines(axis: Axis): TCoord[][] {
    const covered = new Set<string>();
    const lines: TCoord[][] = [];
    for (const coord of this.shape.coords) {
      if (covered.has(String(coord))) {
        continue;
      }
      const line = this.line(coord, axis);
      line.forEach((cell) => covered.add(String(cell)));
      lines.push(line);
    }
    return lines;
  }

  /**
   * `coord` turned `steps` turns clockwise around `centre`, as the geometry
   * does it. The result may fall outside the board: check it with
   * `contains`.
   */
  rotate(coord: TCoord, steps: number, centre?: TCoord): TCoord {
    return this.geometry.rotate(coord, steps, centre);
  }

  /**
   * An independent copy with the same shape, geometry and cells. The cell
   * values themselves are shared, so cell types must be immutable value
   * objects (as `domain-model.md` defines them).
   */
  clone(): Board<TCell, TCoord> {
    const copy = new Board<TCell, TCoord>(this.shape, this.geometry);
    this.cells.forEach((cell, key) => copy.cells.set(key, cell));
    return copy;
  }

  private assertInside(coord: TCoord): void {
    if (!this.contains(coord)) {
      throw new RangeError(`The cell ${String(coord)} is not on the board`);
    }
  }
}
