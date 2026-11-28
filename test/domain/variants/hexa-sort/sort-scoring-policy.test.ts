import { SortScoringPolicy } from '@domain/variants/hexa-sort/sort-scoring-policy';

describe('SortScoringPolicy', () => {
  it('should_score_zero_when_no_stack_is_cleared', () => {
    // Act / Assert: transfers alone earn nothing.
    expect(
      new SortScoringPolicy().pointsFor({
        transfers: 3,
        goals: 0,
        chipsCleared: 0,
      }),
    ).toBe(0);
  });

  it('should_score_one_point_per_cleared_chip_when_one_goal', () => {
    // Act / Assert: a removed stack of 13 chips (RN-40).
    expect(
      new SortScoringPolicy().pointsFor({
        transfers: 1,
        goals: 1,
        chipsCleared: 13,
      }),
    ).toBe(13);
  });

  it('should_multiply_by_the_goals_when_one_cascade_completes_two', () => {
    // Act / Assert: 20 chips in two goals score 20 x 2 (RN-40).
    expect(
      new SortScoringPolicy().pointsFor({
        transfers: 2,
        goals: 2,
        chipsCleared: 20,
      }),
    ).toBe(40);
  });

  it('should_use_the_configured_chip_value', () => {
    // Act / Assert: RN-40 values are adjustable by configuration.
    expect(
      new SortScoringPolicy(3).pointsFor({
        transfers: 1,
        goals: 1,
        chipsCleared: 10,
      }),
    ).toBe(30);
  });
});
