import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import { GameEngine } from '../../engine/game/game-engine';
import type { GameState } from '../../engine/game/game-state';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import { MergeRules } from './merge-rules';
import { MergeScoringPolicy } from './merge-scoring-policy';
import type { TileMerged } from './merge-tiles';
import type { SlideMove } from './slide-tiles';
import type { Tile } from './tile';

/**
 * The board radius used when the game options give none. The size is data
 * the game receives when it starts (RNF-01); this is the only place of its
 * default.
 */
export const DEFAULT_MERGE_BOARD_RADIUS = 2;

/** Parameter Object: what can be configured when a Hexa Merge game starts. */
export interface MergeGameOptions {
  readonly boardRadius?: number;
}

export type InitialMergeTile = readonly [HexCoord, Tile];

/** Builds the hexagonal board of the configured radius used by Hexa Merge. */
export function createMergeBoard(
  initialTiles: readonly InitialMergeTile[] = [],
  options: MergeGameOptions = {},
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

/** Starts a Hexa Merge session with optional starting tiles placed on the board. */
export function startMergeGame(
  initialTiles: readonly InitialMergeTile[] = [],
  options: MergeGameOptions = {},
): GameEngine<Tile, HexCoord, SlideMove, GameState, TileMerged<HexCoord>> {
  return GameEngine.start({
    board: createMergeBoard(initialTiles, options),
    state: { score: 0, moveCount: 0 },
    rules: new MergeRules<HexCoord>(new MergeScoringPolicy<HexCoord>()),
    seed: null,
  });
}
