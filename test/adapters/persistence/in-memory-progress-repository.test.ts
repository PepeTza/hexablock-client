import type { PlayerProgress } from '@domain/progress/player-progress';

import { InMemoryProgressRepository } from '@adapters/persistence/in-memory-progress-repository';

describe('InMemoryProgressRepository', () => {
  it('should_return_saved_progress_when_game_was_saved', async () => {
    // Arrange
    const repository = new InMemoryProgressRepository();
    const progress: PlayerProgress = {
      gameId: 'hexa-lines',
      highScore: 840,
      levels: {},
    };

    // Act
    await repository.save(progress);
    const loaded = await repository.findByGame('hexa-lines');

    // Assert
    expect(loaded).toEqual(progress);
  });

  it('should_return_null_when_game_has_no_progress', async () => {
    // Arrange
    const repository = new InMemoryProgressRepository();

    // Act
    const loaded = await repository.findByGame('hexa-merge');

    // Assert
    expect(loaded).toBeNull();
  });
});
