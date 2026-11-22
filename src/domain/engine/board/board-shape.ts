import type { IBoardGeometry } from '../geometry/board-geometry';
import type { ICoord } from '../geometry/coord';

/**
 * Value object: the set of cells that exist on a board (glossary: Board
 * shape). Either every cell within a radius of the geometry's origin (the
 * radius-4 and radius-2 hexagons on the hex geometry) or a free-form figure
 * (Hexa Fit).
 *
 * Parameterised by `TCoord extends ICoord` so any geometry family defines its
 * own board shapes without changing this class.
 * `contains` is what the board passes to the geometry as `isInside`.
 */
export class BoardShape<TCoord extends ICoord> {
  /** The cells of the shape, each once, in the order they were given. */
  readonly coords: readonly TCoord[];
  private readonly keys: ReadonlySet<string>;

  private constructor(coords: readonly TCoord[]) {
    this.coords = coords;
    this.keys = new Set(coords.map((coord) => coord.key()));
  }

  /**
   * Every cell at most `radius` steps from `geometry.origin`, built from the
   * rings of `geometry`: 61 cells for radius 4 and 19 for radius 2 on hexagons.
   */
  static ofRadius<TCoord extends ICoord>(
    geometry: IBoardGeometry<TCoord>,
    radius: number,
  ): BoardShape<TCoord> {
    if (!Number.isInteger(radius) || radius < 0) {
      throw new RangeError(
        `Board radius must be a non-negative integer: ${radius}`,
      );
    }
    const coords: TCoord[] = [];
    for (let ring = 0; ring <= radius; ring++) {
      coords.push(...geometry.ring(geometry.origin, ring));
    }
    return new BoardShape<TCoord>(coords);
  }

  /** A free-form figure with exactly the given cells; repeated cells count once. */
  static of<TCoord extends ICoord>(
    coords: Iterable<TCoord>,
  ): BoardShape<TCoord> {
    const unique = new Map<string, TCoord>();
    for (const coord of coords) {
      unique.set(coord.key(), coord);
    }
    if (unique.size === 0) {
      throw new RangeError('A board shape needs at least one cell');
    }
    return new BoardShape<TCoord>([...unique.values()]);
  }

  get size(): number {
    return this.coords.length;
  }

  contains(coord: TCoord): boolean {
    return this.keys.has(coord.key());
  }
}
