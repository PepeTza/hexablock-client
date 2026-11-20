import type { Axis } from './axis';
import type { ICoord } from './coord';
import type { Direction } from './direction';

/**
 * Neighbourhood and axes of the cells of a board (RF-01).
 *
 * Parameterised by `TCoord extends ICoord` so each geometry defines its own
 * coordinate value object without burdening 2D grids with unused attributes,
 * while the compiler prevents mixing coordinates from different geometries
 * (RNF-14, docs/EXTENSIBILITY.md). There is no default coordinate type: the
 * generic engine never imports a concrete geometry (DIP); the hexagonal one
 * lives in `engine/hex/`.
 *
 * A geometry works on an unbounded grid: it knows nothing about the shape or
 * the edges of a board. Whatever needs edges (`line`) receives an
 * `isInside` function from the board, so the same geometry serves a
 * hexagonal board and a free-form figure.
 *
 * `Board<TCell, TCoord>` receives an implementation by composition (Strategy).
 * Rotation is not part of it: planar geometries also implement
 * `IPlanarRotation` (Interface Segregation), so a 3D grid is not forced to
 * fake one.
 */
export interface IBoardGeometry<TCoord extends ICoord> {
  /** The origin cell, used as the default centre of radius shapes. */
  readonly origin: TCoord;

  /**
   * The neighbourhood directions of a cell, in a fixed order that each
   * geometry documents (clockwise from east on hexagons).
   */
  readonly directions: readonly Direction[];

  /** The line orientations of the grid. */
  readonly axes: readonly Axis[];

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
   * `coord` moved by the same offset that takes `from` to `to`. Used to place
   * a piece, whose cells are relative to its centre, at a cell of the board,
   * without reading the components of a coordinate (RNF-14).
   */
  translate(coord: TCoord, from: TCoord, to: TCoord): TCoord;
}
