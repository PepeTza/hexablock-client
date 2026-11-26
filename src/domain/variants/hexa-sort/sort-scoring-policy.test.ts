import { SortScoringPolicy } from './sort-scoring-policy';

describe('SortScoringPolicy', () => {
  it('should_award_no_points_when_no_chip_is_cleared', () => {
    // Act / Assert: nothing is cleared until HU21 (#73).
    expect(
      new SortScoringPolicy().pointsFor({
        transfers: 3,
        goals: 0,
        chipsCleared: 0,
      }),
    ).toBe(0);
  });

  it('should_award_one_point_per_cleared_chip', () => {
    // Act / Assert
    expect(
      new SortScoringPolicy().pointsFor({
        transfers: 1,
        goals: 1,
        chipsCleared: 10,
      }),
    ).toBe(10);
  });
});
