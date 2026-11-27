import type { Board } from '../../engine/board/board';
import type { DomainEvent } from '../../engine/events/domain-event';
import type { ICoord } from '../../engine/geometry/coord';
import type {
  IRandomSource,
  WeightedEntry,
} from '../../engine/random/random-source';
import { Tile } from './tile';

/**
 * Default weighted pool for new Hexa Merge tiles (RN-28, RN-44): 90 % twos
 * and 10 % fours. This ratio follows Gabriele Cirulli's 2048
 * (https://github.com/gabrielecirulli/2048, MIT); the code is our own.
 */
export const DEFAULT_MERGE_SPAWN_WEIGHTS: readonly WeightedEntry<Tile>[] = [
  { item: new Tile(2), weight: 90 },
  { item: new Tile(4), weight: 10 },
];

/** Default number of starting tiles placed on non-border cells (RN-44). */
export const DEFAULT_MERGE_INITIAL_TILE_COUNT = 2;

/** Observer event (RF-06): a new tile with `value` appeared at `cell`. */
export interface TileSpawned<TCoord extends ICoord> extends DomainEvent {
  readonly type: 'TileSpawned';
  readonly cell: TCoord;
  readonly value: number;
}

/** Validates that a spawn pool is non-empty and every weight is positive and finite. */
export function validateSpawnWeights(
  entries: readonly WeightedEntry<Tile>[],
): readonly WeightedEntry<Tile>[] {
  if (entries.length === 0) {
    throw new RangeError('Merge spawn weights need at least one entry');
  }
  const validated: WeightedEntry<Tile>[] = [];
  for (const entry of entries) {
    if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
      throw new RangeError(
        `Every spawn weight must be a positive finite number: ${entry.weight}`,
      );
    }
    validated.push({ item: entry.item, weight: entry.weight });
  }
  return validated;
}

/**
 * Cells that are not on the border of `board`: every direction of the board
 * geometry leads to another cell inside the board (RNF-14, RN-44).
 */
export function interiorCells<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
): TCoord[] {
  const directionCount = board.geometry.directions.length;
  return board.shape.coords.filter(
    (cell) => board.neighbours(cell).length === directionCount,
  );
}

/**
 * Places one tile drawn from `weights` on a random empty cell of `board`
 * using the injected `IRandomSource` (RN-28, RN-05). Returns `null` if the
 * board has no empty cells.
 */
export function spawnTile<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
  random: IRandomSource,
  weights: readonly WeightedEntry<Tile>[] = DEFAULT_MERGE_SPAWN_WEIGHTS,
): TileSpawned<TCoord> | null {
  const validatedWeights = validateSpawnWeights(weights);
  const emptyCells = board.shape.coords.filter((cell) => board.isEmpty(cell));
  if (emptyCells.length === 0) {
    return null;
  }
  const cell = random.pick(emptyCells);
  const tile = random.pickWeighted(validatedWeights);
  board.place(cell, tile);
  return { type: 'TileSpawned', cell, value: tile.value };
}

/**
 * Places `count` starting tiles on distinct random non-border empty cells so
 * every direction is available for the first move (RN-44). Throws a
 * `RangeError` if `count` is invalid or exceeds the available non-border cells.
 */
export function spawnInitialTiles<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
  random: IRandomSource,
  count: number = DEFAULT_MERGE_INITIAL_TILE_COUNT,
  weights: readonly WeightedEntry<Tile>[] = DEFAULT_MERGE_SPAWN_WEIGHTS,
): TileSpawned<TCoord>[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(
      `Initial tile count must be a non-negative integer: ${count}`,
    );
  }
  const validatedWeights = validateSpawnWeights(weights);
  const available = interiorCells(board).filter((cell) => board.isEmpty(cell));
  if (count > available.length) {
    throw new RangeError(
      `Initial tile count (${count}) exceeds available non-border cells (${available.length})`,
    );
  }
  const spawned: TileSpawned<TCoord>[] = [];
  for (let i = 0; i < count; i++) {
    const index = random.nextInt(0, available.length - 1);
    const cell = available[index];
    if (cell === undefined) {
      break;
    }
    available.splice(index, 1);
    const tile = random.pickWeighted(validatedWeights);
    board.place(cell, tile);
    spawned.push({ type: 'TileSpawned', cell, value: tile.value });
  }
  return spawned;
}
