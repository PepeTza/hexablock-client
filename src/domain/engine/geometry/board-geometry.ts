import type { Axis } from './axis';
import type { Coord } from './coord';
import type { Direction } from './direction';

/**
 * Neighbourhood, axes and rotation of the cells of a board (RF-01).
 *
 * Each geometry declares its own directions and axes, so a different cell
 * shape (e.g. squares) is a new implementation in its own file: nothing else
 * changes (RNF-14, docs/EXTENSIBILITY.md).
 *
 * A geometry works on an unbounded grid: it knows nothing about the shape or
 * the edges of a board. Whatever needs edges (`line`) receives an
 * `isInside` function from the board, so the same geometry serves a
 * hexagonal board and a free-form figure.
 *
 * `Board<TCell>` receives an implementation by composition (Strategy).
 */
export interface IBoardGeometry {
  /** The neighbourhood directions of a cell, in clockwise order. */
  readonly directions: readonly Direction[];

  /** The line orientations of the grid. */
  readonly axes: readonly Axis[];

  /**
   * The cell one step from `coord` in `direction`. Throws when `direction`
   * is not one of `directions`.
   */
  neighbour(coord: Coord, direction: Direction): Coord;

  /** The neighbours of `coord`, one per direction, in the order of `directions`. */
  neighbours(coord: Coord): Coord[];

  /**
   * The line through `coord` along `axis`, ordered from one end to the
   * other, limited to the cells where `isInside` is true. Empty when `coord`
   * itself is outside. `isInside` must describe a finite region.
   */
  line(coord: Coord, axis: Axis, isInside: (cell: Coord) => boolean): Coord[];

  /**
   * The cells at exactly `radius` steps from `centre`; only `centre` when
   * the radius is 0.
   */
  ring(centre: Coord, radius: number): Coord[];

  /**
   * `coord` turned clockwise around `centre` (the origin by default) by
   * `steps` turns of one direction each (60° on hexagons); negative steps
   * turn counter-clockwise.
   */
  rotate(coord: Coord, steps: number, centre?: Coord): Coord;
}
