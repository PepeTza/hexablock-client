import type { Board } from '../../engine/board/board';
import type { Resolved } from '../../engine/game/base-game-rules';
import {
  SourcedGameRules,
  type SourcedState,
} from '../../engine/game/sourced-game-rules';
import type { ICoord } from '../../engine/geometry/coord';
import type {
  IRandomSource,
  WeightedEntry,
} from '../../engine/random/random-source';
import type { IScoringPolicy } from '../../engine/scoring/scoring-policy';
import {
  mergeTiles,
  type MergeResolution,
  type TileMerged,
} from './merge-tiles';
import { slideTiles, type SlideMove } from './slide-tiles';
import {
  DEFAULT_MERGE_SPAWN_WEIGHTS,
  spawnTile,
  validateSpawnWeights,
  type TileSpawned,
} from './spawn-tile';
import type { Tile } from './tile';

/** State of a Hexa Merge game: score, move count and random-source snapshot. */
export type MergeState = SourcedState<IRandomSource>;

/** Domain events emitted by Hexa Merge rules during a move (RF-06). */
export type MergeEvent<TCoord extends ICoord> =
  TileMerged<TCoord> | TileSpawned<TCoord>;

/**
 * Template Method + Memento (`SourcedGameRules`): slide tiles in one of the
 * board geometry's directions (RN-26, RN-28), merge the equal tiles that
 * collide (RN-27), spawn a new tile on a random empty cell (RN-28), and tell
 * the scoring policy what each merge produced (RN-29), emitting `TileMerged`
 * and `TileSpawned` events. Generic over the coordinate (RNF-14): only the
 * place that assembles the game (`merge-game.ts`) chooses the hexagonal
 * geometry. Victory and defeat detection follow in #79.
 */
export class MergeRules<TCoord extends ICoord> extends SourcedGameRules<
  Tile,
  TCoord,
  SlideMove,
  MergeState,
  MergeResolution<TCoord>,
  IRandomSource,
  MergeEvent<TCoord>
> {
  private readonly spawnWeights: readonly WeightedEntry<Tile>[];

  constructor(
    scoring: IScoringPolicy<MergeResolution<TCoord>>,
    spawnWeights: readonly WeightedEntry<Tile>[] = DEFAULT_MERGE_SPAWN_WEIGHTS,
  ) {
    super(scoring);
    this.spawnWeights = validateSpawnWeights(spawnWeights);
  }

  protected validate(
    board: Board<Tile, TCoord>,
    _state: MergeState,
    move: SlideMove,
  ): string | null {
    if (!board.geometry.directions.includes(move.direction)) {
      return 'Slide direction does not belong to the board geometry';
    }
    const preview = board.clone();
    const moved = slideTiles(preview, move.direction);
    const merges = mergeTiles(preview, move.direction);
    if (!moved && merges.length === 0) {
      return 'Slide does not move any tile';
    }
    return null;
  }

  protected apply(
    board: Board<Tile, TCoord>,
    _state: MergeState,
    move: SlideMove,
  ): void {
    slideTiles(board, move.direction);
  }

  protected resolveWith(
    board: Board<Tile, TCoord>,
    state: MergeState,
    move: SlideMove,
    source: IRandomSource,
  ): Resolved<MergeState, MergeResolution<TCoord>, MergeEvent<TCoord>> {
    const merges = mergeTiles(board, move.direction);
    const spawned = spawnTile(board, source, this.spawnWeights);
    const events: MergeEvent<TCoord>[] = merges.map(({ cell, value }) => ({
      type: 'TileMerged',
      cell,
      value,
    }));
    if (spawned !== null) {
      events.push(spawned);
    }
    return {
      state,
      resolution: { merges },
      events,
    };
  }

  protected evaluateEnd(): null {
    // Target tile and no-move defeat detection are implemented in HU28 (#79).
    return null;
  }
}
