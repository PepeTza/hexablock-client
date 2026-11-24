import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import type { EventListener } from '../../engine/events/domain-event';
import { GameEngine } from '../../engine/game/game-engine';
import {
  SourcedGameRules,
  type SourcedState,
} from '../../engine/game/sourced-game-rules';
import type { ICoord } from '../../engine/geometry/coord';
import type { HexCoord } from '../../engine/hex/hex-coord';
import { HexGeometry } from '../../engine/hex/hex-geometry';
import type { Piece } from '../../engine/pieces/piece';
import type { IPieceSource } from '../../engine/pieces/piece-source';
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
  readonly listeners?: readonly EventListener[];
  /** An explicit shape takes precedence over the default or supplied radius. */
  readonly boardShape?: BoardShape<HexCoord>;
  readonly boardRadius?: number;
  readonly traySize?: number;
  readonly placedColor?: string;
  /** Overrides the positional weights when both are supplied. */
  readonly weights?: ReadonlyMap<string, number>;
}

export interface LinesGameState<TCoord extends ICoord = HexCoord>
  extends LinesState, SourcedState<IPieceSource<Piece<TCoord>>> {
  /** Consumed slots stay empty until the entire tray is replaced (RN-08). */
  readonly tray: readonly (Piece<TCoord> | null)[];
}

export interface PlacePieceMove<TCoord extends ICoord = HexCoord> {
  readonly slot: number;
  readonly anchor: TCoord;
}

/** Template Method: place the offered piece, resolve lines and consume its slot. */
export class LinesGameRules<
  TCoord extends ICoord = HexCoord,
> extends SourcedGameRules<
  string,
  TCoord,
  PlacePieceMove<TCoord>,
  LinesGameState<TCoord>,
  LinesResolution,
  IPieceSource<Piece<TCoord>>,
  LineCleared<TCoord>
> {
  constructor(
    scoring: LinesScoringPolicy,
    private readonly traySize: number,
    private readonly placedColor: string,
  ) {
    super(scoring);
  }

  protected validate(
    board: Board<string, TCoord>,
    state: LinesGameState<TCoord>,
    move: PlacePieceMove<TCoord>,
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
    board: Board<string, TCoord>,
    state: LinesGameState<TCoord>,
    move: PlacePieceMove<TCoord>,
  ): void {
    this.pieceFor(state, move)
      .cellsAt(move.anchor)
      .forEach((cell) => board.place(cell, this.placedColor));
  }

  protected resolveWith(
    board: Board<string, TCoord>,
    state: LinesGameState<TCoord>,
    move: PlacePieceMove<TCoord>,
    source: IPieceSource<Piece<TCoord>>,
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

  protected evaluateEnd(
    board: Board<string, TCoord>,
    state: LinesGameState<TCoord>,
  ): 'defeat' | null {
    const canPlay = state.tray.some(
      (piece) =>
        piece !== null &&
        board.shape.coords.some((anchor) => fitsAt(board, piece, anchor)),
    );
    return canPlay ? null : 'defeat';
  }

  private pieceFor(
    state: LinesGameState<TCoord>,
    move: PlacePieceMove<TCoord>,
  ): Piece<TCoord> {
    const piece = state.tray[move.slot];
    if (piece == null) {
      throw new Error('Validated Lines move must have a piece');
    }
    return piece;
  }
}

function fitsAt<TCoord extends ICoord>(
  board: Board<string, TCoord>,
  piece: Piece<TCoord>,
  anchor: TCoord,
): boolean {
  return piece
    .cellsAt(anchor)
    .every((cell) => board.contains(cell) && board.isEmpty(cell));
}

/** Start a Lines session with an empty board and the first seeded tray. */
export function createLinesGame(
  seed: number,
  weights?: ReadonlyMap<string, number>,
  {
    listeners,
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
  const source: IPieceSource<Piece<HexCoord>> = createLinesPieceSource(
    new SeededRandom(seed),
    shapeWeights,
  );
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
    listeners,
  });
}
