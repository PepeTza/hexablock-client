import { Tile } from './tile';

describe('Tile', () => {
  it.each([2, 4, 8, 16, 2048, 2 ** 32])(
    'should_keep_the_value_when_it_is_a_power_of_two (%s)',
    (value) => {
      // Arrange / Act
      const tile = new Tile(value);

      // Assert
      expect(tile.value).toBe(value);
    },
  );

  it('should_compare_tiles_by_value_when_checking_equality', () => {
    // Arrange
    const twoA = new Tile(2);
    const twoB = new Tile(2);
    const four = new Tile(4);

    // Act / Assert
    expect(twoA.equals(twoB)).toBe(true);
    expect(twoA.equals(four)).toBe(false);
  });

  it.each([
    0,
    1,
    -2,
    3,
    6,
    2.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    2 ** 32 + 1,
  ])(
    'should_throw_range_error_when_the_value_is_not_a_positive_power_of_two (%s)',
    (value) => {
      // Arrange / Act
      const create = () => new Tile(value);

      // Assert
      expect(create).toThrow(RangeError);
    },
  );
});
