import type { Board } from '../../engine/board/board';
import type { DomainEvent } from '../../engine/events/domain-event';
import type { ICoord } from '../../engine/geometry/coord';
import type { Direction } from '../../engine/geometry/direction';
import { raysInDirection } from './slide-tiles';
import type { Tile } from './tile';

/** One merge of a move: the cell of the new tile and its value. */
export interface MergedTile<TCoord extends ICoord> {
  readonly cell: TCoord;
  readonly value: number;
}

/** What a Hexa Merge move resolved, for the scoring policy (RN-29). */
export interface MergeResolution<TCoord extends ICoord> {
  readonly merges: readonly MergedTile<TCoord>[];
}

/** Observer event (RF-06): two equal tiles merged into `value` at `cell`. */
export interface TileMerged<TCoord extends ICoord> extends DomainEvent {
  readonly type: 'TileMerged';
  readonly cell: TCoord;
  readonly value: number;
}

/**
 * Merges equal tiles that collide along `direction` into one of double value
 * (RN-27) and packs every line against the target edge, returning the merges
 * with the cell where each new tile ends.
 *
 * Each line is walked from the target edge backwards, so the tiles closest
 * to that edge merge first, and both tiles of a merge are consumed, so a
 * tile never merges twice in the same move. This rule follows Gabriele
 * Cirulli's 2048 (https://github.com/gabrielecirulli/2048, MIT); the code is
 * our own.
 */
export function mergeTiles<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
  direction: Direction,
): MergedTile<TCoord>[] {
  const merges: MergedTile<TCoord>[] = [];
  for (const ray of raysInDirection(board, direction)) {
    merges.push(...mergeRay(board, ray));
  }
  return merges;
}

/** Rebuilds one line, index 0 at the target edge, with its merges applied. */
function mergeRay<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
  ray: readonly TCoord[],
): MergedTile<TCoord>[] {
  const tiles: Tile[] = [];
  for (const cell of ray) {
    const tile = board.cellAt(cell);
    if (tile !== undefined) {
      tiles.push(tile);
      board.remove(cell);
    }
  }

  const merges: MergedTile<TCoord>[] = [];
  let index = 0;
  for (const cell of ray) {
    const front = tiles[index];
    if (front === undefined) {
      break;
    }
    const behind = tiles[index + 1];
    if (behind !== undefined && front.equals(behind)) {
      const merged = front.doubled();
      board.place(cell, merged);
      merges.push({ cell, value: merged.value });
      index += 2;
    } else {
      board.place(cell, front);
      index += 1;
    }
  }

  return merges;
}
