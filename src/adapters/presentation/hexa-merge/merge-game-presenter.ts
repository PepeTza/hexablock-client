import type { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import type { GameEngine } from '@domain/engine/game/game-engine';
import type { ICoord } from '@domain/engine/geometry/coord';
import type { Direction } from '@domain/engine/geometry/direction';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import type {
  MergeEvent,
  MergeState,
} from '@domain/variants/hexa-merge/merge-rules';
import type { SlideMove } from '@domain/variants/hexa-merge/slide-tiles';
import type { Tile } from '@domain/variants/hexa-merge/tile';

export type MergeGameSession<TCoord extends ICoord> = GameEngine<
  Tile,
  TCoord,
  SlideMove,
  MergeState,
  MergeEvent<TCoord>
>;

/** Read-only cell snapshot rendered by the Hexa Merge view. */
export interface MergeBoardCellView<TCoord extends ICoord> {
  readonly coord: TCoord;
  readonly value: number | null;
}

/** Read-only view model rendered by `MergeGameScreen`. */
export interface MergeGameViewModel<TCoord extends ICoord> {
  readonly board: readonly MergeBoardCellView<TCoord>[];
  readonly score: number;
  readonly moveCount: number;
  readonly targetReached: boolean;
  readonly canUndo: boolean;
  readonly seed: number | null;
}

/** Presenter: exposes Hexa Merge board and session actions independently of board geometry. */
export class MergeGamePresenter<TCoord extends ICoord = HexCoord> {
  private readonly startedAt: number;
  private result: Promise<Either<Error, FinishGameOutput>> | null = null;

  constructor(
    private readonly game: MergeGameSession<TCoord>,
    private readonly finishGame: AsyncCommandService<
      FinishedGameSummary,
      FinishGameOutput
    >,
    private readonly now: () => number,
  ) {
    this.startedAt = now();
  }

  get view(): MergeGameViewModel<TCoord> {
    const { board, state, canUndo, seed } = this.game;
    return {
      board: board.shape.coords.map((coord) => ({
        coord,
        value: board.cellAt(coord)?.value ?? null,
      })),
      score: state.score,
      moveCount: state.moveCount,
      targetReached: state.targetReached,
      canUndo,
      seed,
    };
  }

  slide(direction: Direction): boolean {
    const result = this.game.applyMove({ direction });
    if (result.kind !== 'applied') return false;
    this.game.resolutionDone();
    return true;
  }

  undo(): boolean {
    return this.game.undo();
  }

  finishIfOver(): Promise<Either<Error, FinishGameOutput>> | null {
    if (this.result !== null) return this.result;

    const reason = this.game.outcome;
    if (reason === null) return null;
    this.result = this.finishGame.execute({
      gameId: 'hexa-merge',
      levelId: null,
      reason,
      score: this.game.state.score,
      moveCount: this.game.state.moveCount,
      durationMs: Math.max(0, this.now() - this.startedAt),
      seed: this.game.seed,
    });
    return this.result;
  }
}
