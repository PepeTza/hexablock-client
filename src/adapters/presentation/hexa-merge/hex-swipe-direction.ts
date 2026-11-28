import type { Direction } from '@domain/engine/geometry/direction';
import { HexDirection } from '@domain/engine/hex/hex-geometry';

/** Minimum pointer travel in logical pixels before a drag counts as a swipe. */
export const DEFAULT_MIN_SWIPE_DISTANCE = 24;

const CLOCKWISE_DIRECTIONS: readonly Direction[] = [
  HexDirection.EAST,
  HexDirection.SOUTH_EAST,
  HexDirection.SOUTH_WEST,
  HexDirection.WEST,
  HexDirection.NORTH_WEST,
  HexDirection.NORTH_EAST,
];

const FULL_TURN = 2 * Math.PI;
const SECTOR_ANGLE = FULL_TURN / CLOCKWISE_DIRECTIONS.length;
const SECTOR_HALF_ANGLE = SECTOR_ANGLE / 2;

/**
 * Maps a 2D screen drag vector `(dx, dy)` (x right, y down) to the closest
 * pointy-top `HexDirection` (D-21), or `null` when the drag is shorter than
 * `minDistance`.
 *
 * Each direction owns a 60° sector centred on its screen angle:
 * `EAST` (0°), `SOUTH_EAST` (60°), `SOUTH_WEST` (120°), `WEST` (180°),
 * `NORTH_WEST` (-120°), and `NORTH_EAST` (-60°).
 */
export function resolveHexSwipeDirection(
  dx: number,
  dy: number,
  minDistance: number = DEFAULT_MIN_SWIPE_DISTANCE,
): Direction | null {
  if (!Number.isFinite(minDistance) || minDistance <= 0) {
    throw new RangeError(
      `Minimum swipe distance must be finite and positive: ${minDistance}`,
    );
  }
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return null;
  }
  if (Math.hypot(dx, dy) < minDistance) {
    return null;
  }
  const angle = Math.atan2(dy, dx);
  const shifted =
    (((angle + SECTOR_HALF_ANGLE) % FULL_TURN) + FULL_TURN) % FULL_TURN;
  const index =
    Math.floor(shifted / SECTOR_ANGLE) % CLOCKWISE_DIRECTIONS.length;
  return CLOCKWISE_DIRECTIONS[index] ?? null;
}
