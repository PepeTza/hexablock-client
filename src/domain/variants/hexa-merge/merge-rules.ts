import type { Board } from '../../engine/board/board';
import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { GameState } from '../../engine/game/game-state';
import type { ICoord } from '../../engine/geometry/coord';
import { slideTiles, type SlideMove } from './slide-tiles';
import type { Tile } from './tile';

/**
 * Template Method: slide tiles in one of the board geometry's directions
 * (RN-26, RN-28). Generic over the coordinate (RNF-14): only the place that
 * assembles the game (`merge-game.ts`) chooses the hexagonal geometry.
 * Merging, tile spawning and victory/defeat detection follow in #69, #70 and #79.
 */
export class MergeRules<TCoord extends ICoord> extends BaseGameRules<
  Tile,
  TCoord,
  SlideMove,
  GameState,
  void
> {
  protected validate(
    board: Board<Tile, TCoord>,
    _state: GameState,
    move: SlideMove,
  ): string | null {
    if (!board.geometry.directions.includes(move.direction)) {
      return 'Slide direction does not belong to the board geometry';
    }
    if (!slideTiles(board.clone(), move.direction)) {
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
    _board: Board<Tile, TCoord>,
    state: GameState,
  ): Resolved<GameState, void> {
    return { state, resolution: undefined };
  }

  protected evaluateEnd(): null {
    // Target tile and no-move defeat detection are implemented in HU28 (#79).
    return null;
  }
}
