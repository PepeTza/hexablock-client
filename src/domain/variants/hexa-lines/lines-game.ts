import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
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
import {
  resolveLines,
  type LineCleared,
  type LinesState,
} from './resolve-lines';

export interface LinesGameOptions {
  /** An explicit shape takes precedence over the default or supplied radius. */
  readonly boardShape?: BoardShape<HexCoord>;
  readonly boardRadius?: number;
  readonly traySize?: number;
  readonly placedColor?: string;
  /** Overrides the positional weights when both are supplied. */
  readonly weights?: ReadonlyMap<string, number>;
}

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
  LinesPieceSource,
  LineCleared<HexCoord>
> {
  constructor(
    scoring: LinesScoringPolicy,
    private readonly traySize: number,
    private readonly placedColor: string,
  ) {
    super(scoring);
  }

  protected validate(
    board: HexBoard<string>,
    state: LinesGameState,
    move: PlacePieceMove,
  ): string | null {
    const piece = state.tray[move.slot];
    if (piece == null) {
      return 'Tray slot has no piece';
    }
    const fits = piece
      .cellsAt(move.anchor)
      .every((cell) => board.contains(cell) && board.isEmpty(cell));
    return fits ? null : 'Piece does not fit at this anchor';
  }

  protected apply(
    board: HexBoard<string>,
    state: LinesGameState,
    move: PlacePieceMove,
  ): void {
    this.pieceFor(state, move)
      .cellsAt(move.anchor)
      .forEach((cell) => board.place(cell, this.placedColor));
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
      ? source.draw(this.traySize)
      : remaining;
    return { ...resolved, state: { ...resolved.state, tray } };
  }

  protected evaluateEnd(): null {
    // Defeat detection is implemented in HU14 (#33).
    return null;
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

/** Start a Lines session with an empty board and the first seeded tray. */
export function createLinesGame(
  seed: number,
  weights?: ReadonlyMap<string, number>,
  {
    boardShape,
    boardRadius = 4,
    traySize = 3,
    placedColor = 'blue',
    weights: shapeWeights = weights,
  }: LinesGameOptions = {},
) {
  if (!Number.isSafeInteger(traySize) || traySize < 1) {
    throw new RangeError('The Lines tray size must be a positive integer');
  }
  const geometry = new HexGeometry();
  const board = new Board<string, HexCoord>(
    boardShape ?? BoardShape.ofRadius(geometry, boardRadius),
    geometry,
  );
  const source = createLinesPieceSource(new SeededRandom(seed), shapeWeights);
  const state: LinesGameState = {
    moveCount: 0,
    score: 0,
    streak: 0,
    tray: source.draw(traySize),
    source: Snapshot.of(source),
  };
  return GameEngine.start({
    board,
    state,
    rules: new LinesGameRules(new LinesScoringPolicy(), traySize, placedColor),
    seed,
  });
}
