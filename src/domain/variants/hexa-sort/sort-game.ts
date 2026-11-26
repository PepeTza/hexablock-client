import { Board } from '../../engine/board/board';
import { BoardShape } from '../../engine/board/board-shape';
import type { GameOutcome } from '../../engine/events/domain-event';
import { GameEngine } from '../../engine/game/game-engine';
import {
  SourcedGameRules,
  type SourcedState,
} from '../../engine/game/sourced-game-rules';
import type { IBoardGeometry } from '../../engine/geometry/board-geometry';
import type { ICoord } from '../../engine/geometry/coord';
import { SeededRandom } from '../../engine/random/seeded-random';
import { Snapshot } from '../../engine/state/snapshot';
import type { FinishedGameSummary } from '../../progress/progress-model';
import { ColorStack } from './color-stack';
import { resolveCascade, type SortResolution } from './resolve-cascade';
import { DEFAULT_CLEAR_AT } from './sort-rules';
import { SortScoringPolicy } from './sort-scoring-policy';
import { SortStackSource, type SortTrayConfig } from './sort-stack-source';

export interface SortGameState extends SourcedState<SortStackSource> {
  /** The stack the player places next (a tray of one stack, #133). */
  readonly tray: ColorStack;
  /** Goals completed so far (RN-23): the counter the screen shows. */
  readonly goals: number;
}

export interface PlaceStackMove<TCoord extends ICoord> {
  readonly cell: TCoord;
}

/**
 * A Hexa Sort setup for any cell shape. The geometry (hexagons, squares,
 * triangles...) and the board's figure come from outside (DIP), so a new
 * shape needs a new geometry, not a change in Hexa Sort (OCP).
 */
export interface SortSetup<TCoord extends ICoord> {
  readonly geometry: IBoardGeometry<TCoord>;
  readonly shape: BoardShape<TCoord>;
  readonly blocked?: readonly TCoord[];
  readonly initialStacks?: ReadonlyArray<{
    readonly cell: TCoord;
    readonly chips: readonly number[];
  }>;
  readonly tray: SortTrayConfig;
  /** Goals needed to win (RN-24): the level's `goals` in the level spec. */
  readonly goalTarget: number;
}

/**
 * Template Method: place the tray stack on an empty cell (RN-20), then
 * transfer top runs in cascade (RN-21, RN-22) and offer the next stack.
 * Generic over the coordinate: it only uses the board and `key()`.
 */
class SortGameRules<TCoord extends ICoord> extends SourcedGameRules<
  ColorStack,
  TCoord,
  PlaceStackMove<TCoord>,
  SortGameState,
  SortResolution,
  SortStackSource
> {
  constructor(
    scoring: SortScoringPolicy,
    /** Top-run length that completes a goal (RN-23). */
    private readonly clearAt: number,
    /** Goals needed to win (RN-24). */
    private readonly goalTarget: number,
  ) {
    super(scoring);
  }

  protected validate(
    board: Board<ColorStack, TCoord>,
    _state: SortGameState,
    move: PlaceStackMove<TCoord>,
  ): string | null {
    if (!board.contains(move.cell)) {
      return 'Cell is not on the board';
    }
    return board.isEmpty(move.cell) ? null : 'Cell already holds a stack';
  }

  protected apply(
    board: Board<ColorStack, TCoord>,
    state: SortGameState,
    move: PlaceStackMove<TCoord>,
  ): void {
    board.place(move.cell, state.tray);
  }

  protected resolveWith(
    board: Board<ColorStack, TCoord>,
    state: SortGameState,
    move: PlaceStackMove<TCoord>,
    source: SortStackSource,
  ) {
    const { resolution, events } = resolveCascade(
      board,
      move.cell,
      this.clearAt,
    );
    return {
      state: {
        ...state,
        tray: source.next(),
        goals: state.goals + resolution.goals,
      },
      resolution,
      events,
    };
  }

  /**
   * RN-24: victory once the goals reach the target; defeat when, after the
   * cascade, no empty cell is left to place on. Victory is checked first, so
   * the move that meets the goals always wins.
   */
  protected evaluateEnd(
    board: Board<ColorStack, TCoord>,
    state: SortGameState,
  ): GameOutcome | null {
    if (state.goals >= this.goalTarget) {
      return 'victory';
    }
    const full = board.shape.coords.every((cell) => !board.isEmpty(cell));
    return full ? 'defeat' : null;
  }
}

/**
 * Start a Hexa Sort session on any board, with the first stack drawn.
 * Blocked cells are taken out of the figure, so for the rules they do not
 * exist.
 */
export function createSortGame<TCoord extends ICoord>(
  seed: number,
  setup: SortSetup<TCoord>,
) {
  if (!Number.isInteger(setup.goalTarget) || setup.goalTarget < 1) {
    throw new RangeError(
      `The goal target must be an integer >= 1: ${setup.goalTarget}`,
    );
  }
  const blocked = new Set((setup.blocked ?? []).map((cell) => cell.key()));
  const cells = setup.shape.coords.filter((cell) => !blocked.has(cell.key()));
  const board = new Board<ColorStack, TCoord>(
    BoardShape.of(cells),
    setup.geometry,
  );
  for (const { cell, chips } of setup.initialStacks ?? []) {
    board.place(cell, ColorStack.of(chips));
  }

  const source = SortStackSource.create(setup.tray, new SeededRandom(seed));
  const state: SortGameState = {
    moveCount: 0,
    score: 0,
    tray: source.next(),
    goals: 0,
    source: Snapshot.of(source),
  };
  return GameEngine.start({
    board,
    state,
    rules: new SortGameRules<TCoord>(
      new SortScoringPolicy(),
      DEFAULT_CLEAR_AT,
      setup.goalTarget,
    ),
    seed,
  });
}

/**
 * The facts of a finished Hexa Sort game for `FinishGameUseCase` (CU-07):
 * the outcome, the score (RN-40), the moves and the seed the result screen
 * shows (RF-16). `null` while the game is still being played.
 */
export function summarizeSortGame(
  game: {
    readonly state: SortGameState;
    readonly outcome: GameOutcome | null;
    readonly seed: number | null;
  },
  levelId: string,
  durationMs: number,
): FinishedGameSummary | null {
  if (game.outcome === null) return null;

  const { score, moveCount } = game.state;
  return {
    gameId: 'hexa-sort',
    levelId,
    reason: game.outcome,
    score,
    moveCount,
    durationMs,
    seed: game.seed,
  };
}
