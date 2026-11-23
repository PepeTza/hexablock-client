import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import type { EventListener } from '../../engine/events/domain-event';
import { GameEngine } from '../../engine/game/game-engine';
import {
  SourcedGameRules,
  type SourcedState,
} from '../../engine/game/sourced-game-rules';
import type { HexBoard } from '../../engine/hex/hex-board';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import type { Piece } from '../../engine/pieces/piece';
import { SeededRandom } from '../../engine/random/seeded-random';
import { Snapshot } from '../../engine/state/snapshot';
import { createLinesPieceSource } from './lines-piece-source';
import {
  LinesScoringPolicy,
  type LinesResolution,
} from './lines-scoring-policy';
import { resolveLines, type LinesState } from './resolve-lines';

const TRAY_SIZE = 3;
const BOARD_RADIUS = 4;
const PLACED_COLOR = 'blue';

type LinesPieceSource = ReturnType<typeof createLinesPieceSource>;

export interface LinesGameState
  extends LinesState, SourcedState<LinesPieceSource> {
  /** Consumed slots stay empty until the entire tray is replaced (RN-08). */
  readonly tray: readonly (Piece<HexCoord> | null)[];
}

export interface PlacePieceMove {
  readonly slot: number;
  readonly anchor: HexCoord;
}

/** Template Method: place the offered piece, resolve lines and consume its slot. */
class LinesGameRules extends SourcedGameRules<
  string,
  HexCoord,
  PlacePieceMove,
  LinesGameState,
  LinesResolution,
  LinesPieceSource
> {
  protected validate(
    board: HexBoard<string>,
    state: LinesGameState,
    move: PlacePieceMove,
  ): string | null {
    const piece = state.tray[move.slot];
    if (piece == null) {
      return 'Tray slot has no piece';
    }
    return fitsAt(board, piece, move.anchor)
      ? null
      : 'Piece does not fit at this anchor';
  }

  protected apply(
    board: HexBoard<string>,
    state: LinesGameState,
    move: PlacePieceMove,
  ): void {
    this.pieceFor(state, move)
      .cellsAt(move.anchor)
      .forEach((cell) => board.place(cell, PLACED_COLOR));
  }

  protected resolveWith(
    board: HexBoard<string>,
    state: LinesGameState,
    move: PlacePieceMove,
    source: LinesPieceSource,
  ) {
    const resolved = resolveLines(
      board,
      state,
      this.pieceFor(state, move).shape.size,
    );
    const remaining = state.tray.map((piece, slot) =>
      slot === move.slot ? null : piece,
    );
    const tray = remaining.every((piece) => piece === null)
      ? source.draw(TRAY_SIZE)
      : remaining;
    return { ...resolved, state: { ...resolved.state, tray } };
  }

  protected evaluateEnd(
    board: HexBoard<string>,
    state: LinesGameState,
  ): 'defeat' | null {
    const canPlay = state.tray.some(
      (piece) =>
        piece !== null &&
        board.shape.coords.some((anchor) => fitsAt(board, piece, anchor)),
    );
    return canPlay ? null : 'defeat';
  }

  private pieceFor(
    state: LinesGameState,
    move: PlacePieceMove,
  ): Piece<HexCoord> {
    const piece = state.tray[move.slot];
    if (piece == null) {
      throw new Error('Validated Lines move must have a piece');
    }
    return piece;
  }
}

function fitsAt(
  board: HexBoard<string>,
  piece: Piece<HexCoord>,
  anchor: HexCoord,
): boolean {
  return piece
    .cellsAt(anchor)
    .every((cell) => board.contains(cell) && board.isEmpty(cell));
}

/** Start a Lines session with an empty board and the first seeded tray. */
export function createLinesGame(
  seed: number,
  weights?: ReadonlyMap<string, number>,
  listeners?: readonly EventListener[],
) {
  const geometry = new HexGeometry();
  const board = new Board<string, HexCoord>(
    BoardShape.ofRadius(geometry, BOARD_RADIUS),
    geometry,
  );
  const source = createLinesPieceSource(new SeededRandom(seed), weights);
  const state: LinesGameState = {
    moveCount: 0,
    score: 0,
    streak: 0,
    tray: source.draw(TRAY_SIZE),
    source: Snapshot.of(source),
  };
  return GameEngine.start({
    board,
    state,
    rules: new LinesGameRules(new LinesScoringPolicy()),
    seed,
    listeners,
  });
}
