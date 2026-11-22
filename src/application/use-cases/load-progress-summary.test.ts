import type { GameId, PlayerProgress } from '@domain/progress/player-progress';

import type { IProgressRepository } from '../ports/progress-repository';
import { LoadProgressSummaryUseCase } from './load-progress-summary';

function createUseCase(
  entries: ReadonlyMap<GameId, PlayerProgress> = new Map(),
): LoadProgressSummaryUseCase {
  const progress: IProgressRepository = {
    findByGame: (gameId) => Promise.resolve(entries.get(gameId) ?? null),
    save: () => Promise.resolve(),
  };
  return new LoadProgressSummaryUseCase({ progress });
}

describe('LoadProgressSummaryUseCase', () => {
  it('should_return_high_score_and_completed_levels_when_progress_exists', async () => {
    // Arrange
    const useCase = createUseCase(
      new Map<GameId, PlayerProgress>([
        ['hexa-lines', { gameId: 'hexa-lines', highScore: 1200, levels: {} }],
        [
          'hexa-fit',
          {
            gameId: 'hexa-fit',
            highScore: 0,
            levels: {
              'fit-01': { completed: true, bestScore: 950, stars: 3 },
              'fit-02': { completed: true, bestScore: 800, stars: 2 },
            },
          },
        ],
      ]),
    );

    // Act
    const summaries = await useCase.execute({
      gameIds: ['hexa-lines', 'hexa-fit'],
    });

    // Assert
    expect(summaries).toEqual([
      { gameId: 'hexa-lines', highScore: 1200, completedLevels: 0 },
      { gameId: 'hexa-fit', highScore: 0, completedLevels: 2 },
    ]);
  });

  it('should_return_zero_summary_when_no_progress_is_saved', async () => {
    // Arrange
    const useCase = createUseCase();

    // Act
    const summaries = await useCase.execute({
      gameIds: ['hexa-merge'],
    });

    // Assert
    expect(summaries).toEqual([
      { gameId: 'hexa-merge', highScore: 0, completedLevels: 0 },
    ]);
  });

  it('should_count_only_completed_levels_when_some_levels_are_incomplete', async () => {
    // Arrange
    const useCase = createUseCase(
      new Map<GameId, PlayerProgress>([
        [
          'hexa-sort',
          {
            gameId: 'hexa-sort',
            highScore: 0,
            levels: {
              'sort-01': { completed: true, bestScore: 400, stars: 0 },
              'sort-02': { completed: false, bestScore: 150, stars: 0 },
              'sort-03': { completed: true, bestScore: 520, stars: 0 },
            },
          },
        ],
      ]),
    );

    // Act
    const summaries = await useCase.execute({
      gameIds: ['hexa-sort'],
    });

    // Assert
    expect(summaries).toEqual([
      { gameId: 'hexa-sort', highScore: 0, completedLevels: 2 },
    ]);
  });
});
