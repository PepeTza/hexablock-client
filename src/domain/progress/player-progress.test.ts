import { emptyProgress, mergeProgress } from './player-progress';

describe('PlayerProgress', () => {
  it('should_create_empty_progress_with_zero_high_score_and_no_levels_when_initialized', () => {
    // Arrange & Act
    const progress = emptyProgress('hexa-lines');

    // Assert
    expect(progress).toEqual({
      gameId: 'hexa-lines',
      highScore: 0,
      levels: {},
    });
  });

  it('should_keep_best_scores_max_stars_and_completed_union_when_merging_progress', () => {
    // Arrange
    const local = {
      gameId: 'hexa-fit',
      highScore: 500,
      levels: {
        'fit-01': { completed: true, bestScore: 300, stars: 2 },
        'fit-02': { completed: false, bestScore: 100, stars: 0 },
      },
    };
    const remote = {
      gameId: 'hexa-fit',
      highScore: 420,
      levels: {
        'fit-01': { completed: true, bestScore: 250, stars: 3 },
        'fit-02': { completed: true, bestScore: 180, stars: 1 },
        'fit-03': { completed: true, bestScore: 220, stars: 2 },
      },
    };

    // Act
    const merged = mergeProgress(local, remote);

    // Assert
    expect(merged).toEqual({
      gameId: 'hexa-fit',
      highScore: 500,
      levels: {
        'fit-01': { completed: true, bestScore: 300, stars: 3 },
        'fit-02': { completed: true, bestScore: 180, stars: 1 },
        'fit-03': { completed: true, bestScore: 220, stars: 2 },
      },
    });
    expect(() =>
      mergeProgress(emptyProgress('hexa-fit'), emptyProgress('hexa-sort')),
    ).toThrow(RangeError);
  });
});
