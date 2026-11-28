import { BoardShape } from '@domain/engine/board/board-shape';
import { HexCoord } from '@domain/engine/hex/hex-coord';
import { Piece } from '@domain/engine/pieces/piece';
import { loadHexPieceCatalog } from '@domain/engine/hex/hex-piece-catalog';
import {
  startFitGame,
  summarizeFitVictory,
} from '@domain/variants/hexa-fit/fit-game';
import { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import type { PlayerProgress } from '@domain/progress/player-progress';
import { FitProgressModel } from '@domain/variants/hexa-fit/fit-progress-model';

import { FinishGameUseCase } from '@application/use-cases/finish-game';

it('should_save_the_fit_stars_for_the_completed_level', async () => {
  // Arrange
  const factories = new VariantFactoryRegistry();
  const rewards = { twoStars: 650, threeStars: 800, nextLevelId: 'fit-02' };
  factories.register('hexa-fit', {
    gameId: 'hexa-fit',
    usesSeed: false,
    usesLevels: true,
    createEngine: () => {
      throw new Error('Finishing does not create a game');
    },
    createProgressModel: () =>
      new FitProgressModel((id) => (id === 'fit-01' ? rewards : undefined)),
  });
  let stored: PlayerProgress | null = null;
  const finish = new FinishGameUseCase({
    factories,
    progress: {
      findByGame: () => Promise.resolve(stored),
      save: (progress) => {
        stored = progress;
        return Promise.resolve();
      },
    },
    sessions: { hasActiveSession: () => Promise.resolve(false) },
    syncQueue: {
      enqueueProgressSync: () => Promise.resolve(),
      enqueueScoreSubmission: () => Promise.resolve(),
    },
    eventBus: { publish: () => undefined },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  });
  const anchor = HexCoord.ORIGIN;
  const catalog = loadHexPieceCatalog();
  const single = Piece.of(catalog.get('p1-01'));
  const pair = Piece.of(catalog.get('p2-01'));
  const spare = new HexCoord(2, 0);
  const game = startFitGame(BoardShape.of([...pair.cellsAt(anchor), spare]), [
    single,
    pair,
  ]);
  const durationMs = 90_000;

  // Act
  const beforeVictory = summarizeFitVictory(game, 'fit-01', durationMs);
  game.applyMove({ pieceId: 0, anchor });
  game.resolutionDone();
  game.applyMove({ kind: 'relocate', pieceId: 0, anchor: spare });
  game.resolutionDone();
  game.applyMove({ pieceId: 1, anchor });
  game.resolutionDone();
  const summary = summarizeFitVictory(game, 'fit-01', durationMs);
  if (summary === null) throw new Error('Expected a completed Fit session');
  const result = await finish.execute(summary);

  // Assert
  expect(beforeVictory).toBeNull();
  expect(summary.moveCount).toBe(3);
  expect(result).toMatchObject({
    kind: 'right',
    value: {
      score: 800,
      stars: 3,
      unlockedLevelId: 'fit-02',
      saveFailed: false,
    },
  });
  expect(stored).toMatchObject({
    levels: { 'fit-01': { completed: true, stars: 3, bestScore: 800 } },
  });
});
