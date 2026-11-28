import type { ILevelSummary } from '../ports/level-repository';
import type { PlayerProgress } from '@domain/progress/player-progress';

import { UnexpectedError } from '../common/unexpected-error';
import { LoadLevelsUseCase } from './load-levels';

function levelSelection(
  levels: readonly ILevelSummary[],
  progress: PlayerProgress | null,
): LoadLevelsUseCase {
  return new LoadLevelsUseCase({
    levels: {
      findByGame: (gameId) =>
        Promise.resolve(levels.filter((level) => level.gameId === gameId)),
    },
    progress: { findByGame: () => Promise.resolve(progress) },
  });
}

describe('LoadLevelsUseCase', () => {
  it('should_unlock_only_the_first_level_when_the_player_has_no_progress', async () => {
    // Arrange
    const gameId = 'hexa-fit';
    const useCase = levelSelection(
      [
        { id: 'fit-next', gameId, order: 20 },
        { id: 'sort-first', gameId: 'hexa-sort', order: 1 },
        { id: 'fit-first', gameId, order: 10 },
      ],
      null,
    );

    // Act
    const result = await useCase.execute({ gameId });
    if (result.kind === 'left') throw result.value;
    const selection = result.value;

    // Assert
    expect(selection).toEqual({
      levels: [
        {
          id: 'fit-first',
          order: 10,
          locked: false,
          completed: false,
          stars: 0,
          bestScore: 0,
        },
        {
          id: 'fit-next',
          order: 20,
          locked: true,
          completed: false,
          stars: 0,
          bestScore: 0,
        },
      ],
      completedLevels: 0,
      totalStars: 0,
    });
  });

  it('should_return_saved_stars_and_unlock_the_next_level_when_the_previous_is_complete', async () => {
    // Arrange
    const gameId = 'hexa-fit';
    const useCase = levelSelection(
      [
        { id: 'fit-1', gameId, order: 1 },
        { id: 'fit-2', gameId, order: 2 },
        { id: 'fit-3', gameId, order: 3 },
      ],
      {
        gameId,
        highScore: 0,
        levels: {
          'fit-1': { completed: true, stars: 3, bestScore: 830 },
          'old-level': { completed: true, stars: 3, bestScore: 900 },
        },
      },
    );

    // Act
    const result = await useCase.execute({ gameId });
    if (result.kind === 'left') throw result.value;
    const selection = result.value;

    // Assert
    expect(selection.levels).toMatchObject([
      { id: 'fit-1', completed: true, locked: false, stars: 3, bestScore: 830 },
      { id: 'fit-2', completed: false, locked: false, stars: 0 },
      { id: 'fit-3', completed: false, locked: true, stars: 0 },
    ]);
    expect(selection).toMatchObject({ completedLevels: 1, totalStars: 3 });
  });

  it('should_show_sort_completion_when_a_level_has_no_stars', async () => {
    // Arrange
    const gameId = 'hexa-sort';
    const useCase = levelSelection([{ id: 'sort-1', gameId, order: 1 }], {
      gameId,
      highScore: 0,
      levels: { 'sort-1': { completed: true, stars: 0, bestScore: 440 } },
    });

    // Act
    const result = await useCase.execute({ gameId });
    if (result.kind === 'left') throw result.value;
    const selection = result.value;

    // Assert
    expect(selection).toMatchObject({
      levels: [{ id: 'sort-1', completed: true, bestScore: 440, stars: 0 }],
      completedLevels: 1,
      totalStars: 0,
    });
  });
});

it('should_return_a_failure_when_saved_progress_cannot_be_loaded', async () => {
  // Arrange
  const failure = new Error('Progress unavailable');
  const useCase = new LoadLevelsUseCase({
    levels: { findByGame: () => Promise.resolve([]) },
    progress: { findByGame: () => Promise.reject(failure) },
  });

  // Act
  const result = await useCase.execute({ gameId: 'hexa-fit' });

  // Assert
  const error = result.fold(
    (err) => err,
    () => null,
  );
  expect(error).toBeInstanceOf(UnexpectedError);
  expect(error?.cause).toBe(failure);
});
