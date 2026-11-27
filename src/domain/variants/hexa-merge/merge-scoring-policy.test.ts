import { HexCoord } from '../../engine/hex/hex-coord';
import { MergeScoringPolicy } from './merge-scoring-policy';

describe('MergeScoringPolicy (RN-29)', () => {
  it('should_sum_the_values_produced_when_several_tiles_merge', () => {
    // Arrange
    const policy = new MergeScoringPolicy<HexCoord>();
    const merges = [
      { cell: new HexCoord(2, 0), value: 4 },
      { cell: new HexCoord(2, -1), value: 8 },
      { cell: new HexCoord(1, 1), value: 16 },
    ];

    // Act
    const points = policy.pointsFor({ merges });

    // Assert
    expect(points).toBe(28);
  });

  it('should_give_zero_points_when_no_tile_merged', () => {
    // Arrange
    const policy = new MergeScoringPolicy<HexCoord>();

    // Act
    const points = policy.pointsFor({ merges: [] });

    // Assert
    expect(points).toBe(0);
  });
});
