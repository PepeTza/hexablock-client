import { VariantFactoryRegistry } from '@domain/engine/game/variant-factory';
import type { PlayerProgress } from '@domain/progress/player-progress';
import { LinesVariantFactory } from '@domain/variants/hexa-lines/lines-variant-factory';

import { FinishGameUseCase } from './finish-game';

it('should_save_only_a_new_record_when_lines_finishes', async () => {
  // Arrange
  const factories = new VariantFactoryRegistry();
  factories.register('hexa-lines', new LinesVariantFactory());
  let saved: PlayerProgress | null = null;
  const save = jest.fn((progress: PlayerProgress) => {
    saved = progress;
    return Promise.resolve();
  });
  const finish = new FinishGameUseCase({
    factories,
    progress: { findByGame: () => Promise.resolve(saved), save },
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
  const summary = {
    gameId: 'hexa-lines',
    levelId: null,
    reason: 'defeat' as const,
    score: 52,
    moveCount: 12,
    durationMs: 1000,
    seed: 42,
  };

  // Act
  const record = await finish.execute(summary);
  const lower = await finish.execute({ ...summary, score: 51 });

  // Assert
  expect(record.isNewRecord).toBe(true);
  expect(lower.isNewRecord).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
  expect(saved).toMatchObject({ highScore: 52 });
});
