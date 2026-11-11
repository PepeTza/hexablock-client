import { Coord } from './coord';

describe('Coord', () => {
  it('should_be_equal_when_coords_have_same_q_and_r', () => {
    // Arrange
    const first = new Coord(2, -1);
    const second = new Coord(2, -1);

    // Act
    const equal = first.equals(second);

    // Assert
    expect(equal).toBe(true);
    expect(first.toString()).toBe(second.toString());
  });

  it('should_derive_s_when_coord_is_created', () => {
    // Arrange / Act
    const coord = new Coord(3, -1);

    // Assert
    expect(coord.s).toBe(-2);
  });

  it('should_throw_when_component_is_not_an_integer', () => {
    // Arrange / Act
    const create = () => new Coord(0.5, 1);

    // Assert
    expect(create).toThrow(RangeError);
  });

  it('should_store_zero_when_component_is_negative_zero', () => {
    // Arrange / Act
    const coord = new Coord(-0, -0);

    // Assert
    expect(Object.is(coord.q, 0)).toBe(true);
    expect(Object.is(coord.r, 0)).toBe(true);
    expect(Object.is(coord.s, 0)).toBe(true);
  });
});
