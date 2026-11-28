import { emptyProgress } from '@domain/progress/player-progress';
import type { FinishedGameSummary } from '@domain/progress/progress-model';
import {
  completedFitScore,
  FitProgressModel,
} from '@domain/variants/hexa-fit/fit-progress-model';

const summary: FinishedGameSummary = {
  gameId: 'hexa-fit',
  levelId: 'fit-01',
  reason: 'victory',
  score: 800,
  moveCount: 6,
  durationMs: 80_000,
  seed: null,
};
const model = new FitProgressModel((id) =>
  id === 'fit-01'
    ? { twoStars: 600, threeStars: 800, nextLevelId: 'fit-02' }
    : undefined,
);

describe('Hexa Fit scoring', () => {
  it.each([
    [4, 4, 0, 1000],
    [6, 4, 80_999, 800],
    [104, 4, 200_000, 100],
  ])(
    'should_score_moves_and_whole_seconds_when_a_level_is_completed',
    (moves, pieces, elapsed, expected) => {
      // Act
      const score = completedFitScore(moves, pieces, elapsed);

      // Assert
      expect(score).toBe(expected);
    },
  );

  it.each([
    [599, 1],
    [600, 2],
    [799, 2],
    [800, 3],
  ])(
    'should_award_stars_when_the_score_reaches_a_level_threshold',
    (score, stars) => {
      // Arrange
      const before = emptyProgress('hexa-fit');

      // Act
      const result = model.evaluate(before, { ...summary, score });

      // Assert
      expect(result.stars).toBe(stars);
      expect(result.progress?.levels['fit-01']).toEqual({
        completed: true,
        bestScore: score,
        stars,
      });
      expect(result.unlockedLevelId).toBe('fit-02');
      expect(before.levels).toEqual({});
    },
  );

  it('should_keep_the_best_record_when_a_repeat_scores_lower', () => {
    // Arrange
    const before = {
      ...emptyProgress('hexa-fit'),
      levels: { 'fit-01': { completed: true, bestScore: 900, stars: 3 } },
    };

    // Act
    const result = model.evaluate(before, { ...summary, score: 600 });

    // Assert
    expect(result).toMatchObject({
      progress: null,
      isNewRecord: false,
      stars: 2,
      unlockedLevelId: null,
    });
  });

  it('should_save_no_stars_when_the_player_quits', () => {
    // Arrange
    const before = emptyProgress('hexa-fit');

    // Act
    const result = model.evaluate(before, { ...summary, reason: 'quit' });

    // Assert
    expect(result).toMatchObject({
      progress: null,
      stars: null,
      shouldSubmitScore: false,
    });
  });
});

it.each([
  [6, 4, 12_000, 380],
  [100, 4, 12_000, 70],
])(
  'should_apply_the_configured_score_economy_when_the_rules_change',
  (moves, pieces, duration, expected) => {
    // Arrange
    const configuration = {
      baseScore: 500,
      minScore: 70,
      moveCost: 30,
      secondCost: 5,
    };

    // Act
    const score = completedFitScore(moves, pieces, duration, configuration);

    // Assert
    expect(score).toBe(expected);
  },
);
