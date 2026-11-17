import type { Axis } from './axis';
import type { ICoord } from './coord';
import type { Direction } from './direction';
import type { HexCoord } from './hex-coord';

/**
 * Neighbourhood, axes and rotation of the cells of a board (RF-01).
 *
 * Parameterised by `TCoord extends ICoord` (defaulting to `HexCoord`) so each
 * geometry defines its own coordinate value object without burdening 2D grids
 * with unused attributes, while the compiler prevents mixing coordinates from
 * different geometries (RNF-14, docs/EXTENSIBILITY.md).
 *
 * A geometry works on an unbounded grid: it knows nothing about the shape or
 * the edges of a board. Whatever needs edges (`line`) receives an
 * `isInside` function from the board, so the same geometry serves a
 * hexagonal board and a free-form figure.
 *
 * `Board<TCell, TCoord>` receives an implementation by composition (Strategy).
 */
export interface IBoardGeometry<TCoord extends ICoord = HexCoord> {
  /** The origin cell used as default centre for radius shapes and rotation. */
  readonly origin: TCoord;

  /** The neighbourhood directions of a cell, in clockwise order. */
  readonly directions: readonly Direction[];

  /** The line orientations of the grid. */
  readonly axes: readonly Axis[];

  /** Number of discrete steps in a full planar turn (6 on hexagons). */
  readonly rotationSteps: number;

  /**
   * The cell one step from `coord` in `direction`. Throws when `direction`
   * is not one of `directions`.
   */
  neighbour(coord: TCoord, direction: Direction): TCoord;

  /** The neighbours of `coord`, one per direction, in the order of `directions`. */
  neighbours(coord: TCoord): TCoord[];

  /**
   * The line through `coord` along `axis`, ordered from one end to the
   * other, limited to the cells where `isInside` is true. Empty when `coord`
   * itself is outside. `isInside` must describe a finite region.
   */
  line(
    coord: TCoord,
    axis: Axis,
    isInside: (cell: TCoord) => boolean,
  ): TCoord[];

  /**
   * The cells at exactly `radius` steps from `centre`; only `centre` when
   * the radius is 0.
   */
  ring(centre: TCoord, radius: number): TCoord[];

  /**
   * `coord` turned clockwise around `centre` (`origin` by default) by
   * `steps` turns of one rotation step each (60° on hexagons); negative steps
   * turn counter-clockwise.
   */
  rotate(coord: TCoord, steps: number, centre?: TCoord): TCoord;
}
