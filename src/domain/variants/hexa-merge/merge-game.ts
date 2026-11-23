import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { GameEngine } from '../../engine/game/game-engine';
import type { GameState } from '../../engine/game/game-state';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { MergeRules } from './merge-rules';
import type { SlideMove } from './slide-tiles';
import type { Tile } from './tile';

export const MERGE_BOARD_RADIUS = 2;

export type InitialMergeTile = readonly [HexCoord, Tile];

/** Builds the radius-2 (19-cell) hexagonal board used by Hexa Merge. */
export function createMergeBoard(
  initialTiles: readonly InitialMergeTile[] = [],
): HexBoard<Tile> {
  const geometry = new HexGeometry();
  const board = new Board<Tile, HexCoord>(
    BoardShape.ofRadius(geometry, MERGE_BOARD_RADIUS),
    geometry,
  );
  for (const [coord, tile] of initialTiles) {
    board.place(coord, tile);
  }
  return board;
}

/** Starts a Hexa Merge session with optional starting tiles placed on the board. */
export function startMergeGame(
  initialTiles: readonly InitialMergeTile[] = [],
): GameEngine<Tile, HexCoord, SlideMove, GameState> {
  return GameEngine.start({
    board: createMergeBoard(initialTiles),
    state: { score: 0, moveCount: 0 },
    // Sliding alone adds no points; merge scoring arrives in HU25 (#69).
    rules: new MergeRules({ pointsFor: () => 0 }),
    seed: null,
  });
}
