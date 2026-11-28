import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { CommandHistory } from '../../engine/commands/command-history';
import type { EventListener } from '../../engine/events/domain-event';
import { GameEngine } from '../../engine/game/game-engine';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import type { WeightedEntry } from '../../engine/random/random-source';
import { SeededRandom } from '../../engine/random/seeded-random';
import { Snapshot } from '../../engine/state/snapshot';
import {
  DEFAULT_MERGE_TARGET_TILE,
  MergeRules,
  type MergeEvent,
  type MergeState,
} from './merge-rules';
import { MergeScoringPolicy } from './merge-scoring-policy';
import type { SlideMove } from './slide-tiles';
import {
  DEFAULT_MERGE_INITIAL_TILE_COUNT,
  DEFAULT_MERGE_SPAWN_WEIGHTS,
  spawnInitialTiles,
  validateSpawnWeights,
} from './spawn-tile';
import { Tile } from './tile';

/**
 * The board radius used when the game options give none. The size is data
 * the game receives when it starts (RNF-01); this is the only place of its
 * default.
 */
export const DEFAULT_MERGE_BOARD_RADIUS = 2;

/** Default undo steps allowed per applied move in Hexa Merge (RN-31). */
export const DEFAULT_MERGE_UNDO_ALLOWANCE = 1;

export type InitialMergeTile = readonly [HexCoord, Tile];

/** Parameter Object: what can be configured when a Hexa Merge game starts. */
export interface MergeGameOptions {
  readonly boardRadius?: number;
  readonly initialTileCount?: number;
  readonly spawnWeights?: readonly WeightedEntry<Tile>[];
  readonly targetTile?: number;
  readonly undoAllowance?: number;
  /** Explicit starting tiles for deterministic setups; skips random placement. */
  readonly initialTiles?: readonly InitialMergeTile[];
  readonly listeners?: readonly EventListener[];
}

/** Builds the hexagonal board of the configured radius used by Hexa Merge. */
export function createMergeBoard(
  initialTiles: readonly InitialMergeTile[] = [],
  options: Pick<MergeGameOptions, 'boardRadius'> = {},
): HexBoard<Tile> {
  const geometry = new HexGeometry();
  const board = new Board<Tile, HexCoord>(
    BoardShape.ofRadius(
      geometry,
      options.boardRadius ?? DEFAULT_MERGE_BOARD_RADIUS,
    ),
    geometry,
  );
  for (const [coord, tile] of initialTiles) {
    board.place(coord, tile);
  }
  return board;
}

/**
 * Starts a seeded Hexa Merge session (RN-05, RN-28, RN-30, RN-44). When
 * `options.initialTiles` is omitted, places `initialTileCount` (default 2)
 * starting tiles on random non-border cells.
 */
export function startMergeGame(
  seed: number,
  options: MergeGameOptions = {},
): GameEngine<Tile, HexCoord, SlideMove, MergeState, MergeEvent<HexCoord>> {
  const spawnWeights = validateSpawnWeights(
    options.spawnWeights ?? DEFAULT_MERGE_SPAWN_WEIGHTS,
  );
  const targetTile = new Tile(options.targetTile ?? DEFAULT_MERGE_TARGET_TILE)
    .value;
  const random = new SeededRandom(seed);
  const board = createMergeBoard(options.initialTiles ?? [], options);
  if (options.initialTiles === undefined) {
    spawnInitialTiles(
      board,
      random,
      options.initialTileCount ?? DEFAULT_MERGE_INITIAL_TILE_COUNT,
      spawnWeights,
    );
  }
  const targetReached = board.shape.coords.some((cell) => {
    const tile = board.cellAt(cell);
    return tile !== undefined && tile.value >= targetTile;
  });
  const state: MergeState = {
    score: 0,
    moveCount: 0,
    targetReached,
    source: Snapshot.of(random),
  };
  const history = new CommandHistory<SlideMove>({
    allowancePerMove: options.undoAllowance ?? DEFAULT_MERGE_UNDO_ALLOWANCE,
    allowRedo: false,
  });
  return GameEngine.start({
    board,
    state,
    rules: new MergeRules<HexCoord>(
      new MergeScoringPolicy<HexCoord>(),
      spawnWeights,
      targetTile,
    ),
    seed,
    history,
    listeners: options.listeners,
  });
}
