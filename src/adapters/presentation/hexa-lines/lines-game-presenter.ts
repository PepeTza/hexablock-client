import type { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import type { AsyncCommandService } from '@application/use-cases/use-case';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type { createLinesGame } from '@domain/variants/hexa-lines/lines-game';

import { previewLinesPlacement } from './lines-placement-preview';

export class LinesGamePresenter {
  private readonly startedAt: number;
  private result: Promise<Either<Error, FinishGameOutput>> | null = null;

  constructor(
    private readonly game: ReturnType<typeof createLinesGame>,
    private readonly finishGame: AsyncCommandService<
      FinishedGameSummary,
      FinishGameOutput
    >,
    private readonly now: () => number,
  ) {
    this.startedAt = now();
  }

  get view() {
    return {
      board: this.game.board.shape.coords.map((coord) => ({
        coord,
        occupied: !this.game.board.isEmpty(coord),
      })),
      tray: this.game.state.tray.map((piece) => piece?.cells() ?? null),
      score: this.game.state.score,
    };
  }

  preview(slot: number, anchor: HexCoord) {
    return previewLinesPlacement(this.game, { slot, anchor });
  }

  place(slot: number, anchor: HexCoord): boolean {
    const result = this.game.applyMove({ slot, anchor });
    if (result.kind !== 'applied') return false;
    this.game.resolutionDone();
    return true;
  }

  finishIfOver(): Promise<Either<Error, FinishGameOutput>> | null {
    if (this.result !== null) return this.result;

    const reason = this.game.outcome;
    if (reason === null) return null;
    this.result = this.finishGame.execute({
      gameId: 'hexa-lines',
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
