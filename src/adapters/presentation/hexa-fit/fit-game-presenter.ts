import type { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import {
  type startFitGame,
  summarizeFitVictory,
} from '@domain/variants/hexa-fit/fit-game';
import type { FitMove } from '@domain/variants/hexa-fit/fit-rules';
import type { PieceId } from '@domain/variants/hexa-fit/fit-state';

/** Presenter: exposes Fit board, tray and session actions for the mobile screen. */
export class FitGamePresenter {
  readonly pieceCount: number;
  private readonly startedAt: number;
  private wonAt: number | null = null;
  private result: Promise<Either<Error, FinishGameOutput>> | null = null;

  constructor(
    private readonly game: ReturnType<typeof startFitGame>,
    readonly levelId: string,
    private readonly finishGame: AsyncCommandService<
      FinishedGameSummary,
      FinishGameOutput
    >,
    private readonly now: () => number,
  ) {
    this.pieceCount = game.state.pendingPieces.length;
    this.startedAt = now();
  }

  get view() {
    const { board, state, canUndo, canRedo } = this.game;
    return {
      board: board.shape.coords.map((coord) => ({
        coord,
        pieceId: board.cellAt(coord),
      })),
      tray: state.pendingPieces.map(({ id, piece }) => ({
        id,
        cells: piece.cells(),
      })),
      placed: state.placedPieces.map(({ id, anchor }) => ({ id, anchor })),
      moveCount: state.moveCount,
      canUndo,
      canRedo,
    };
  }

  get durationMs(): number {
    return Math.max(0, (this.wonAt ?? this.now()) - this.startedAt);
  }

  preview(pieceId: PieceId, anchor: HexCoord) {
    const pieces = [
      ...this.game.state.pendingPieces,
      ...this.game.state.placedPieces,
    ];
    const piece = pieces.find(({ id }) => id === pieceId)?.piece;
    return {
      valid:
        this.game.preview(this.placement(pieceId, anchor)).kind === 'applied',
      cells: piece?.cellsAt(anchor) ?? [],
    };
  }

  place(pieceId: PieceId, anchor: HexCoord): string | null {
    return this.apply(this.placement(pieceId, anchor));
  }

  rotate(pieceId: PieceId): string | null {
    return this.apply({ kind: 'rotate', pieceId, rotationSteps: 1 });
  }

  remove(pieceId: PieceId): string | null {
    return this.apply({ kind: 'remove', pieceId });
  }

  undo(): void {
    this.game.undo();
  }

  redo(): void {
    this.game.redo();
  }

  finishIfOver(): Promise<Either<Error, FinishGameOutput>> | null {
    if (this.result !== null) return this.result;

    const summary = summarizeFitVictory(
      this.game,
      this.levelId,
      this.durationMs,
    );
    if (summary === null) return null;

    this.result = this.finishGame.execute(summary);
    return this.result;
  }

  private placement(pieceId: PieceId, anchor: HexCoord): FitMove<HexCoord> {
    const placed = this.game.state.placedPieces.some(
      ({ id }) => id === pieceId,
    );
    return { kind: placed ? 'relocate' : 'place', pieceId, anchor };
  }

  private apply(move: FitMove<HexCoord>): string | null {
    const result = this.game.applyMove(move);
    if (result.kind === 'rejected') return result.reason;
    this.game.resolutionDone();
    if (this.game.outcome === 'victory') this.wonAt = this.now();
    return null;
  }
}
