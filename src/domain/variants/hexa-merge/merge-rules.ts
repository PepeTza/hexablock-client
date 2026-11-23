import {
  BaseGameRules,
  type Resolved,
} from '../../engine/game/base-game-rules';
import type { GameState } from '../../engine/game/game-state';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { slideTiles, type SlideMove } from './slide-tiles';
import type { Tile } from './tile';

/**
 * Template Method: slide tiles in one of the six hex directions (RN-26, RN-28).
 * Merging, tile spawning and victory/defeat detection follow in #69, #70 and #79.
 */
export class MergeRules extends BaseGameRules<
  Tile,
  HexCoord,
  SlideMove,
  GameState,
  void
> {
  protected validate(
    board: HexBoard<Tile>,
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
    board: HexBoard<Tile>,
    _state: GameState,
    move: SlideMove,
  ): void {
    slideTiles(board, move.direction);
  }

  protected resolve(
    _board: HexBoard<Tile>,
    state: GameState,
  ): Resolved<GameState, void> {
    return { state, resolution: undefined };
  }

  protected evaluateEnd(): null {
    // Target tile and no-move defeat detection are implemented in HU28 (#79).
    return null;
  }
}
