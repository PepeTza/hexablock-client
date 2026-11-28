import { HexDirection } from '@domain/engine/hex/hex-geometry';

import {
  DEFAULT_MIN_SWIPE_DISTANCE,
  resolveHexSwipeDirection,
} from '@adapters/presentation/hexa-merge/hex-swipe-direction';

describe('resolveHexSwipeDirection', () => {
  it('should_map_each_sixty_degree_sector_to_the_matching_hex_direction_when_swipe_exceeds_threshold', () => {
    // Arrange
    const distance = 80;
    const cases = [
      { angleDeg: 0, expected: HexDirection.EAST },
      { angleDeg: 25, expected: HexDirection.EAST },
      { angleDeg: -25, expected: HexDirection.EAST },
      { angleDeg: 60, expected: HexDirection.SOUTH_EAST },
      { angleDeg: 85, expected: HexDirection.SOUTH_EAST },
      { angleDeg: 120, expected: HexDirection.SOUTH_WEST },
      { angleDeg: 145, expected: HexDirection.SOUTH_WEST },
      { angleDeg: 180, expected: HexDirection.WEST },
      { angleDeg: -160, expected: HexDirection.WEST },
      { angleDeg: -120, expected: HexDirection.NORTH_WEST },
      { angleDeg: -95, expected: HexDirection.NORTH_WEST },
      { angleDeg: -60, expected: HexDirection.NORTH_EAST },
      { angleDeg: -35, expected: HexDirection.NORTH_EAST },
    ];

    // Act
    const results = cases.map(({ angleDeg }) => {
      const radians = (angleDeg * Math.PI) / 180;
      return resolveHexSwipeDirection(
        Math.cos(radians) * distance,
        Math.sin(radians) * distance,
      );
    });

    // Assert
    cases.forEach(({ expected }, index) => {
      expect(results[index]).toBe(expected);
    });
  });

  it('should_return_null_when_swipe_distance_is_below_minimum_threshold', () => {
    // Arrange
    const shortDx = DEFAULT_MIN_SWIPE_DISTANCE - 1;

    // Act
    const horizontal = resolveHexSwipeDirection(shortDx, 0);
    const stationary = resolveHexSwipeDirection(0, 0);

    // Assert
    expect(horizontal).toBeNull();
    expect(stationary).toBeNull();
  });

  it('should_respect_custom_minimum_distance_when_configured', () => {
    // Arrange
    const customThreshold = 60;

    // Act
    const tooShort = resolveHexSwipeDirection(50, 0, customThreshold);
    const longEnough = resolveHexSwipeDirection(60, 0, customThreshold);

    // Assert
    expect(tooShort).toBeNull();
    expect(longEnough).toBe(HexDirection.EAST);
  });
});
