import { BoardShape } from '../../engine/board/board-shape';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { createSortGame, type SortSetup } from './sort-game';

/** The level spec v1 fixes the radius at 2 (19 cells). */
const DEFAULT_RADIUS = 2;

/** A hexagonal Hexa Sort level, with the names of the level spec (§6). */
export interface HexSortSpec extends Omit<
  SortSetup<HexCoord>,
  'geometry' | 'shape'
> {
  readonly radius?: number;
}

/**
 * The only place where Hexa Sort meets hexagons: it builds the hexagonal
 * geometry and the board of the given radius, then starts the
 * geometry-agnostic game. Another cell shape adds a function like this one;
 * nothing else in Hexa Sort changes (OCP).
 */
export function createHexSortGame(seed: number, spec: HexSortSpec) {
  const { radius = DEFAULT_RADIUS, ...rest } = spec;
  const geometry = new HexGeometry();
  return createSortGame(seed, {
    ...rest,
    geometry,
    shape: BoardShape.ofRadius(geometry, radius),
  });
}
