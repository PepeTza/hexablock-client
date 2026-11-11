import { Axis } from './axis';
import type { IBoardGeometry } from './board-geometry';
import { Coord } from './coord';
import { Direction } from './direction';

// Axial coordinates on pointy-top hexagons, following Red Blob Games,
// "Hexagonal Grids" (https://www.redblobgames.com/grids/hexagons/):
// neighbours, rings ("Rings") and rotation ("Rotation").

/**
 * The six neighbourhood directions of a pointy-top hex cell (RN-01, D-21):
 * there is an east and a west neighbour.
 */
export const HexDirection = Object.freeze({
  EAST: new Direction('EAST'),
  SOUTH_EAST: new Direction('SOUTH_EAST'),
  SOUTH_WEST: new Direction('SOUTH_WEST'),
  WEST: new Direction('WEST'),
  NORTH_WEST: new Direction('NORTH_WEST'),
  NORTH_EAST: new Direction('NORTH_EAST'),
});

/**
 * The three line orientations of the hex board (RN-01, RN-09), named after
 * the cube coordinate that stays constant along their lines:
 *
 * - `R`: rows running west to east (same `r`).
 * - `Q`: lines running north-west to south-east (same `q`).
 * - `S`: lines running south-west to north-east (same `s`).
 */
export const HexAxis = Object.freeze({
  Q: new Axis('Q'),
  R: new Axis('R'),
  S: new Axis('S'),
});

/** The six directions in clockwise order, starting at east. */
const DIRECTIONS: readonly Direction[] = Object.freeze([
  HexDirection.EAST,
  HexDirection.SOUTH_EAST,
  HexDirection.SOUTH_WEST,
  HexDirection.WEST,
  HexDirection.NORTH_WEST,
  HexDirection.NORTH_EAST,
]);

const AXES: readonly Axis[] = Object.freeze([HexAxis.Q, HexAxis.R, HexAxis.S]);

/** The step of each direction, as `[dq, dr]`. */
const OFFSETS = new Map<Direction, readonly [number, number]>([
  [HexDirection.EAST, [1, 0]],
  [HexDirection.SOUTH_EAST, [0, 1]],
  [HexDirection.SOUTH_WEST, [-1, 1]],
  [HexDirection.WEST, [-1, 0]],
  [HexDirection.NORTH_WEST, [0, -1]],
  [HexDirection.NORTH_EAST, [1, -1]],
]);

/** The two directions of each axis, as `[backward, forward]`. */
const AXIS_DIRECTIONS = new Map<Axis, readonly [Direction, Direction]>([
  [HexAxis.R, [HexDirection.WEST, HexDirection.EAST]],
  [HexAxis.Q, [HexDirection.NORTH_WEST, HexDirection.SOUTH_EAST]],
  [HexAxis.S, [HexDirection.SOUTH_WEST, HexDirection.NORTH_EAST]],
]);

const DIRECTIONS_PER_TURN = DIRECTIONS.length;

/**
 * Strategy: the hexagonal implementation of `IBoardGeometry`, with axial
 * coordinates `q, r` (see `Coord`).
 */
export class HexGeometry implements IBoardGeometry {
  readonly directions = DIRECTIONS;
  readonly axes = AXES;

  neighbour(coord: Coord, direction: Direction): Coord {
    const [dq, dr] = lookup(OFFSETS, direction, 'direction');
    return new Coord(coord.q + dq, coord.r + dr);
  }

  neighbours(coord: Coord): Coord[] {
    return DIRECTIONS.map((direction) => this.neighbour(coord, direction));
  }

  /** Ordered west to east (R), north-west to south-east (Q) or south-west to north-east (S). */
  line(coord: Coord, axis: Axis, isInside: (cell: Coord) => boolean): Coord[] {
    if (!isInside(coord)) {
      return [];
    }
    const [backward, forward] = lookup(AXIS_DIRECTIONS, axis, 'axis');

    let start = coord;
    let previous = this.neighbour(start, backward);
    while (isInside(previous)) {
      start = previous;
      previous = this.neighbour(start, backward);
    }

    const cells: Coord[] = [];
    for (
      let cell = start;
      isInside(cell);
      cell = this.neighbour(cell, forward)
    ) {
      cells.push(cell);
    }
    return cells;
  }

  /** Clockwise, starting at the cell `radius` steps east of `centre`. */
  ring(centre: Coord, radius: number): Coord[] {
    if (!Number.isInteger(radius) || radius < 0) {
      throw new RangeError(
        `Ring radius must be a non-negative integer: ${radius}`,
      );
    }
    if (radius === 0) {
      return [centre];
    }

    // Start at the east corner and walk each of the six sides. Going
    // clockwise, the side after the corner in direction i runs in
    // direction i + 2 (from the east corner, south-west).
    let cell = this.walk(centre, HexDirection.EAST, radius);
    const cells: Coord[] = [];
    for (let side = 0; side < DIRECTIONS_PER_TURN; side++) {
      const direction = directionAt(side + 2);
      for (let step = 0; step < radius; step++) {
        cells.push(cell);
        cell = this.neighbour(cell, direction);
      }
    }
    return cells;
  }

  rotate(coord: Coord, steps: number, centre: Coord = Coord.ORIGIN): Coord {
    if (!Number.isInteger(steps)) {
      throw new RangeError(`Rotation steps must be an integer: ${steps}`);
    }
    const turns = mod(steps, DIRECTIONS_PER_TURN);

    let q = coord.q - centre.q;
    let r = coord.r - centre.r;
    for (let turn = 0; turn < turns; turn++) {
      // 60° clockwise in cube coordinates: (q, r, s) → (-r, -s, -q),
      // and -s = q + r.
      [q, r] = [-r, q + r];
    }
    return new Coord(q + centre.q, r + centre.r);
  }

  private walk(from: Coord, direction: Direction, steps: number): Coord {
    let cell = from;
    for (let step = 0; step < steps; step++) {
      cell = this.neighbour(cell, direction);
    }
    return cell;
  }
}

/** The direction at `index` in `DIRECTIONS`, wrapping around after six. */
function directionAt(index: number): Direction {
  const direction = DIRECTIONS[mod(index, DIRECTIONS_PER_TURN)];
  if (direction === undefined) {
    throw new Error(`No direction at index ${index}`);
  }
  return direction;
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * Looks up the data of a hex direction or axis. A `Direction` or `Axis`
 * created elsewhere (e.g. by another geometry) is not in the map: TypeScript
 * cannot tell them apart, so the check happens here.
 */
function lookup<TKey, TValue>(
  map: ReadonlyMap<TKey, TValue>,
  key: TKey,
  kind: string,
): TValue {
  const value = map.get(key);
  if (value === undefined) {
    throw new RangeError(
      `The ${kind} ${String(key)} does not belong to the hexagonal geometry`,
    );
  }
  return value;
}
