import type { Board } from '../../engine/board/board';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { GameState } from '../../engine/game/game-state';
import type { ICoord } from '../../engine/geometry/coord';
import {
  mergeTiles,
  type MergeResolution,
  type TileMerged,
} from './merge-tiles';
import { slideTiles, type SlideMove } from './slide-tiles';
import type { Tile } from './tile';

/**
 * Template Method: slide tiles in one of the board geometry's directions
 * (RN-26, RN-28), then merge the equal tiles that collide (RN-27) and tell
 * the scoring policy what each merge produced (RN-29), with one `TileMerged`
 * event per merge. Generic over the coordinate (RNF-14): only the place that
 * assembles the game (`merge-game.ts`) chooses the hexagonal geometry.
 * Tile spawning and victory/defeat detection follow in #70 and #79.
 */
export class MergeRules<TCoord extends ICoord> extends BaseGameRules<
  Tile,
  TCoord,
  SlideMove,
  GameState,
  MergeResolution<TCoord>,
  TileMerged<TCoord>
> {
  protected validate(
    board: Board<Tile, TCoord>,
    _state: GameState,
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
    _state: GameState,
    move: SlideMove,
  ): void {
    slideTiles(board, move.direction);
  }

  protected resolve(
    board: Board<Tile, TCoord>,
    state: GameState,
    move: SlideMove,
  ): Resolved<GameState, MergeResolution<TCoord>, TileMerged<TCoord>> {
    const merges = mergeTiles(board, move.direction);
    return {
      state,
      resolution: { merges },
      events: merges.map(({ cell, value }) => ({
        type: 'TileMerged',
        cell,
        value,
      })),
    };
  }

  protected evaluateEnd(): null {
    // Target tile and no-move defeat detection are implemented in HU28 (#79).
    return null;
  }
}
