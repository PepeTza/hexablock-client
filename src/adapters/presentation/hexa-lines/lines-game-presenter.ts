import type {
  FinishGameOutput,
  FinishGameUseCase,
} from '@application/use-cases/finish-game';
import type { HexCoord } from '@domain/engine/hex/hex-coord';
import type { createLinesGame } from '@domain/variants/hexa-lines/lines-game';

import { previewLinesPlacement } from './lines-placement-preview';

export class LinesGamePresenter {
  private readonly startedAt: number;

  constructor(
    private readonly game: ReturnType<typeof createLinesGame>,
    private readonly finishGame: Pick<FinishGameUseCase, 'execute'>,
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

  finishIfOver(): Promise<FinishGameOutput> | null {
    const reason = this.game.outcome;
    if (reason === null) return null;
    return this.finishGame.execute({
      gameId: 'hexa-lines',
      levelId: null,
      reason,
      score: this.game.state.score,
      moveCount: this.game.state.moveCount,
      durationMs: Math.max(0, this.now() - this.startedAt),
      seed: this.game.seed,
    });
  }
}
