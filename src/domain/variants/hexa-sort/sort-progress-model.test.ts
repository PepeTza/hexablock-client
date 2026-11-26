import {
  emptyProgress,
  type PlayerProgress,
} from '../../progress/player-progress';
import type { FinishedGameSummary } from '../../progress/progress-model';
import { SortProgressModel } from './sort-progress-model';

const summary: FinishedGameSummary = {
  gameId: 'hexa-sort',
  levelId: 'sort-01',
  reason: 'victory',
  score: 120,
  moveCount: 14,
  durationMs: 90_000,
  seed: 7,
};
const model = new SortProgressModel((id) =>
  id === 'sort-01' ? 'sort-02' : null,
);

/** Progress where `sort-01` is already completed with `bestScore`. */
function completedWith(bestScore: number): PlayerProgress {
  return {
    ...emptyProgress('hexa-sort'),
    levels: { 'sort-01': { completed: true, bestScore, stars: 0 } },
  };
}

describe('SortProgressModel', () => {
  it('should_complete_the_level_and_unlock_the_next_when_first_won', () => {
    // Arrange
    const before = emptyProgress('hexa-sort');

    // Act
    const result = model.evaluate(before, summary);

    // Assert: Hexa Sort has no stars (RN-25).
    expect(result).toEqual({
      progress: {
        ...before,
        levels: { 'sort-01': { completed: true, bestScore: 120, stars: 0 } },
      },
      isNewRecord: true,
      stars: null,
      unlockedLevelId: 'sort-02',
      shouldSubmitScore: true,
    });
    expect(before.levels).toEqual({});
  });

  it('should_keep_the_best_score_without_unlocking_again_when_won_again', () => {
    // Act
    const result = model.evaluate(completedWith(200), summary);

    // Assert
    expect(result).toEqual({
      progress: null,
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: false,
    });
  });

  it('should_change_nothing_when_won_again_with_an_equal_score', () => {
    // Act
    const result = model.evaluate(completedWith(120), summary);

    // Assert: an equal score is not a new record.
    expect(result.progress).toBeNull();
    expect(result.isNewRecord).toBe(false);
    expect(result.shouldSubmitScore).toBe(false);
  });

  it('should_submit_the_score_when_it_is_a_new_record', () => {
    // Act
    const result = model.evaluate(completedWith(100), summary);

    // Assert
    expect(result.progress?.levels['sort-01']).toEqual({
      completed: true,
      bestScore: 120,
      stars: 0,
    });
    expect(result.isNewRecord).toBe(true);
    expect(result.shouldSubmitScore).toBe(true);
    expect(result.unlockedLevelId).toBeNull();
  });

  it('should_change_nothing_when_the_level_is_lost', () => {
    // Act
    const result = model.evaluate(emptyProgress('hexa-sort'), {
      ...summary,
      reason: 'defeat',
    });

    // Assert: CU-07 A1.
    expect(result).toEqual({
      progress: null,
      isNewRecord: false,
      stars: null,
      unlockedLevelId: null,
      shouldSubmitScore: false,
    });
  });

  it('should_change_nothing_when_the_player_quits', () => {
    // Act
    const result = model.evaluate(completedWith(100), {
      ...summary,
      reason: 'quit',
    });

    // Assert: CU-07 A1.
    expect(result.progress).toBeNull();
    expect(result.shouldSubmitScore).toBe(false);
    expect(result.unlockedLevelId).toBeNull();
  });
});
