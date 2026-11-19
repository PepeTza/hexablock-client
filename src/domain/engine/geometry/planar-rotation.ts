import type { ICoord } from './coord';
import type { HexCoord } from './hex-coord';

/**
 * Rotation of cells in the plane of a 2D grid, in discrete steps (60° on
 * hexagons), used to turn pieces (Hexa Fit, RN-14) or to spawn them already
 * turned (Hexa Lines, D-07).
 *
 * Kept apart from `IBoardGeometry` (Interface Segregation): only planar
 * geometries implement it, so a 3D grid never fakes a rotation without an
 * axis. A 3D grid that needs rotation adds its own interface, with the axis
 * as a parameter (RNF-14).
 */
export interface IPlanarRotation<TCoord extends ICoord = HexCoord> {
  /** Number of discrete steps in a full turn (6 on hexagons). */
  readonly rotationSteps: number;

  /**
   * `coord` turned clockwise around `centre` (the geometry's origin by
   * default) by `steps` turns of one rotation step each; negative steps turn
   * counter-clockwise.
   */
  rotate(coord: TCoord, steps: number, centre?: TCoord): TCoord;
}
