import { LinesScoringPolicy } from '@domain/variants/hexa-lines/lines-scoring-policy';

describe('LinesScoringPolicy', () => {
  it.each([
    { cellsPlaced: 4, linesCleared: 0, streak: 0, expected: 4 },
    { cellsPlaced: 4, linesCleared: 1, streak: 1, expected: 14 },
    { cellsPlaced: 4, linesCleared: 2, streak: 1, expected: 44 },
    { cellsPlaced: 4, linesCleared: 1, streak: 3, expected: 24 },
    { cellsPlaced: 4, linesCleared: 2, streak: 2, expected: 64 },
    { cellsPlaced: 4, linesCleared: 1, streak: 6, expected: 39 },
  ])(
    'should_award_$expected_points_when_clearing_$linesCleared_lines_at_streak_$streak',
    ({ expected, ...resolution }) => {
      // Arrange
      const policy = new LinesScoringPolicy();

      // Act
      const points = policy.pointsFor(resolution);

      // Assert
      expect(points).toBe(expected);
    },
  );

  it('should_use_configured_points_when_the_policy_overrides_defaults', () => {
    // Arrange
    const policy = new LinesScoringPolicy(2, 12);

    // Act
    const points = policy.pointsFor({
      cellsPlaced: 4,
      linesCleared: 1,
      streak: 2,
    });

    // Assert
    expect(points).toBe(26);
  });
});
