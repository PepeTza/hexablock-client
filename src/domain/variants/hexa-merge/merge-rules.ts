import type { Board } from '../../engine/board/board';
import type {
  DomainEvent,
  GameOutcome,
} from '../../engine/events/domain-event';
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
import { Tile } from './tile';

/** Default tile value that triggers `TargetReached` (RN-30). */
export const DEFAULT_MERGE_TARGET_TILE = 2048;

/** Observer event (RF-06, RN-30, D-22): the target tile was reached; play continues. */
export interface TargetReached extends DomainEvent {
  readonly type: 'TargetReached';
  readonly target: number;
}

/** State of a Hexa Merge game: score, move count, target flag and random snapshot. */
export interface MergeState extends SourcedState<IRandomSource> {
  /** Whether the target tile has already been reached in this session (RN-30). */
  readonly targetReached: boolean;
}

/** Domain events emitted by Hexa Merge rules during a move (RF-06). */
export type MergeEvent<TCoord extends ICoord> =
  TileMerged<TCoord> | TileSpawned<TCoord> | TargetReached;

/**
 * Whether at least one direction can still change `board` (RN-30).
 *
 * A move can change the board if and only if some occupied cell has an
 * in-board neighbour that is empty (slide) or holds an equal tile (merge).
 * Uses only the board geometry (RNF-14) and short-circuits on the first move.
 */
export function hasValidMove<TCoord extends ICoord>(
  board: Board<Tile, TCoord>,
): boolean {
  for (const cell of board.shape.coords) {
    const tile = board.cellAt(cell);
    if (tile === undefined) {
      continue;
    }
    for (const direction of board.geometry.directions) {
      const neighbour = board.geometry.neighbour(cell, direction);
      if (!board.contains(neighbour)) {
        continue;
      }
      const neighbourTile = board.cellAt(neighbour);
      if (neighbourTile === undefined || tile.equals(neighbourTile)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Template Method + Memento (`SourcedGameRules`): slide tiles in one of the
 * board geometry's directions (RN-26, RN-28), merge the equal tiles that
 * collide (RN-27), spawn a new tile on a random empty cell (RN-28), emit
 * `TargetReached` once when the target tile is reached (RN-30, D-22), and
 * end the game as a defeat when no move can change the board (RN-30).
 * Generic over the coordinate (RNF-14): only `merge-game.ts` chooses the
 * hexagonal geometry.
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
  private readonly targetTile: number;

  constructor(
    scoring: IScoringPolicy<MergeResolution<TCoord>>,
    spawnWeights: readonly WeightedEntry<Tile>[] = DEFAULT_MERGE_SPAWN_WEIGHTS,
    targetTile: number = DEFAULT_MERGE_TARGET_TILE,
  ) {
    super(scoring);
    this.spawnWeights = validateSpawnWeights(spawnWeights);
    this.targetTile = new Tile(targetTile).value;
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
    const reachedNow =
      !state.targetReached &&
      (merges.some((merge) => merge.value >= this.targetTile) ||
        (spawned !== null && spawned.value >= this.targetTile));
    if (reachedNow) {
      events.push({ type: 'TargetReached', target: this.targetTile });
    }
    return {
      state: reachedNow ? { ...state, targetReached: true } : state,
      resolution: { merges },
      events,
    };
  }

  /**
   * RN-30 & D-22: reaching the target tile emits `TargetReached` and keeps
   * the session in `PlayingState`; only running out of moves ends the game.
   */
  protected evaluateEnd(board: Board<Tile, TCoord>): GameOutcome | null {
    return hasValidMove(board) ? null : 'defeat';
  }
}
