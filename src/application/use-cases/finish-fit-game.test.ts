import { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import type { PlayerProgress } from '@domain/progress/player-progress';
import {
  completedFitScore,
  FitProgressModel,
} from '@domain/variants/hexa-fit/fit-progress-model';

import { FinishGameUseCase } from './finish-game';

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
  const moveCount = 6;
  const durationMs = 80_000;

  // Act
  const result = await finish.execute({
    gameId: 'hexa-fit',
    levelId: 'fit-01',
    reason: 'victory',
    score: completedFitScore(moveCount, 4, durationMs),
    moveCount,
    durationMs,
    seed: null,
  });

  // Assert
  expect(result).toMatchObject({
    score: 800,
    stars: 3,
    unlockedLevelId: 'fit-02',
    saveFailed: false,
  });
  expect(stored).toMatchObject({
    levels: { 'fit-01': { completed: true, stars: 3, bestScore: 800 } },
  });
});
