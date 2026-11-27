import type { Board } from '../../engine/board/board';
import type { ICoord } from '../../engine/geometry/coord';
import type { Direction } from '../../engine/geometry/direction';

/** Input move for Hexa Merge: slide all tiles in one board direction. */
export interface SlideMove {
  readonly direction: Direction;
}

/**
 * Advances every tile on `board` toward `direction` until the board edge or
 * another tile (RN-26), returning whether at least one tile moved.
 *
 * Uses only `board.geometry` and `ICoord.key()` so coordinates stay opaque
 * outside geometry implementations (RNF-14).
 */
export function slideTiles<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
>(board: Board<TCell, TCoord>, direction: Direction): boolean {
  if (!board.geometry.directions.includes(direction)) {
    throw new RangeError(
      `The direction ${String(direction)} does not belong to the board geometry`,
    );
  }

  let moved = false;
  for (const ray of raysInDirection(board, direction)) {
    if (slideRay(board, ray)) {
      moved = true;
    }
  }
  return moved;
}

/**
 * The lines of cells of `board` along `direction`, each ordered from the
 * target edge backwards, so index 0 is the cell a tile reaches first.
 */
export function raysInDirection<
  TCell extends NonNullable<unknown>,
  TCoord extends ICoord,
>(board: Board<TCell, TCoord>, direction: Direction): TCoord[][] {
  const hasPredecessor = new Set<string>();
  for (const coord of board.shape.coords) {
    const next = board.geometry.neighbour(coord, direction);
    if (board.contains(next)) {
      hasPredecessor.add(next.key());
    }
  }

  const rays: TCoord[][] = [];
  for (const start of board.shape.coords) {
    if (hasPredecessor.has(start.key())) {
      continue;
    }
    const ray: TCoord[] = [];
    for (
      let cell: TCoord = start;
      board.contains(cell);
      cell = board.geometry.neighbour(cell, direction)
    ) {
      ray.push(cell);
    }
    // Order from the target edge backwards so compaction pushes tiles toward index 0.
    ray.reverse();
    rays.push(ray);
  }
  return rays;
}

function slideRay<TCell extends NonNullable<unknown>, TCoord extends ICoord>(
  board: Board<TCell, TCoord>,
  ray: readonly TCoord[],
): boolean {
  const openTargets: TCoord[] = [];
  let moved = false;

  for (const cell of ray) {
    const tile = board.cellAt(cell);
    if (tile === undefined) {
      openTargets.push(cell);
      continue;
    }
    const target = openTargets.shift();
    if (target === undefined) {
      continue;
    }
    board.remove(cell);
    board.place(target, tile);
    openTargets.push(cell);
    moved = true;
  }

  return moved;
}
