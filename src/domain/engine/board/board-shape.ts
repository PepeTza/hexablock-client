import type { IBoardGeometry } from '../geometry/board-geometry';
import { Coord } from '../geometry/coord';

/**
 * Value object: the set of cells that exist on a board (glossary: Board
 * shape). Either every cell within a radius of the centre (the radius-4 and
 * radius-2 hexagons on the hex geometry) or a free-form figure (Hexa Fit).
 *
 * `contains` is what the board passes to the geometry as `isInside`.
 */
export class BoardShape {
  /** The cells of the shape, each once, in the order they were given. */
  readonly coords: readonly Coord[];
  private readonly keys: ReadonlySet<string>;

  private constructor(coords: readonly Coord[]) {
    this.coords = coords;
    this.keys = new Set(coords.map(String));
  }

  /**
   * Every cell at most `radius` steps from the origin, built from the rings
   * of `geometry`: 61 cells for radius 4 and 19 for radius 2 on hexagons.
   */
  static ofRadius(geometry: IBoardGeometry, radius: number): BoardShape {
    if (!Number.isInteger(radius) || radius < 0) {
      throw new RangeError(
        `Board radius must be a non-negative integer: ${radius}`,
      );
    }
    const coords: Coord[] = [];
    for (let ring = 0; ring <= radius; ring++) {
      coords.push(...geometry.ring(Coord.ORIGIN, ring));
    }
    return new BoardShape(coords);
  }

  /** A free-form figure with exactly the given cells; repeated cells count once. */
  static of(coords: Iterable<Coord>): BoardShape {
    const unique = new Map<string, Coord>();
    for (const coord of coords) {
      unique.set(String(coord), coord);
    }
    if (unique.size === 0) {
      throw new RangeError('A board shape needs at least one cell');
    }
    return new BoardShape([...unique.values()]);
  }

  get size(): number {
    return this.coords.length;
  }

  contains(coord: Coord): boolean {
    return this.keys.has(String(coord));
  }
}
