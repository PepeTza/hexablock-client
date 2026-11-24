import { Either } from '@application/common/either';
import type { FinishGameOutput } from '@application/use-cases/finish-game';
import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';
import { Piece } from '@domain/engine/pieces/piece';
import { startFitGame } from '@domain/variants/hexa-fit/fit-game';

import { FitGamePresenter } from './fit-game-presenter';

describe('FitGamePresenter', () => {
  it('should_keep_elapsed_time_when_undoing_and_freeze_it_at_victory', async () => {
    // Arrange
    const origin = HexCoord.ORIGIN;
    const east = new HexCoord(1, 0);
    const single = Piece.of(loadHexPieceCatalog().get('p1-01'));
    const session = startFitGame(BoardShape.of([origin, east]), [
      single,
      single,
    ]);
    let now = 1000;
    const execute = jest.fn(() =>
      Promise.resolve(
        Either.right<FinishGameOutput>({
          score: 994,
          reason: 'victory',
          seed: null,
          isNewRecord: true,
          stars: 3,
          unlockedLevelId: null,
          saveFailed: false,
        }),
      ),
    );
    const presenter = new FitGamePresenter(
      session,
      'fit-demo',
      { execute },
      () => now,
    );

    // Act
    presenter.place(0, origin);
    now += 2000;
    presenter.undo();
    const durationAfterUndo = presenter.durationMs;
    const unfinished = presenter.finishIfOver();
    presenter.redo();
    now += 1000;
    presenter.place(1, east);
    now += 5000;
    const finish = presenter.finishIfOver();
    await finish;

    // Assert
    expect(durationAfterUndo).toBe(2000);
    expect(unfinished).toBeNull();
    expect(presenter.durationMs).toBe(3000);
    expect(presenter.finishIfOver()).toBe(finish);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({
      gameId: 'hexa-fit',
      levelId: 'fit-demo',
      reason: 'victory',
      score: 994,
      moveCount: 2,
      durationMs: 3000,
      seed: null,
    });
  });
});
