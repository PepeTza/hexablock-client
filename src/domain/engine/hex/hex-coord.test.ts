import type { ICoord } from '../geometry/coord';
import { HexCoord } from './hex-coord';

describe('HexCoord', () => {
  it('should_be_equal_when_coords_have_same_q_and_r', () => {
    // Arrange
    const first = new HexCoord(2, -1);
    const second = new HexCoord(2, -1);

    // Act
    const equal = first.equals(second);

    // Assert
    expect(equal).toBe(true);
    expect(first.key()).toBe(second.key());
    expect(first.toString()).toBe(second.toString());
  });

  it('should_not_be_equal_when_compared_with_non_hex_coord', () => {
    // Arrange
    const hex = new HexCoord(2, -1);
    const otherCoord: ICoord = {
      key: () => '2,-1',
    };

    // Act
    const equal = hex.equals(otherCoord);

    // Assert
    expect(equal).toBe(false);
  });

  it('should_derive_s_when_coord_is_created', () => {
    // Arrange / Act
    const coord = new HexCoord(3, -1);

    // Assert
    expect(coord.s).toBe(-2);
  });

  it('should_throw_when_component_is_not_an_integer', () => {
    // Arrange / Act
    const create = () => new HexCoord(0.5, 1);

    // Assert
    expect(create).toThrow(RangeError);
  });

  it('should_store_zero_when_component_is_negative_zero', () => {
    // Arrange / Act
    const coord = new HexCoord(-0, -0);

    // Assert
    expect(Object.is(coord.q, 0)).toBe(true);
    expect(Object.is(coord.r, 0)).toBe(true);
    expect(Object.is(coord.s, 0)).toBe(true);
  });

  it('should_reject_class_without_key_when_used_as_icoord', () => {
    // Arrange
    class CoordWithoutKey {
      toString(): string {
        return '0,0';
      }
    }
    const acceptCoord = (coord: ICoord): string => coord.key();
    const invalid = new CoordWithoutKey();
    const valid = new HexCoord(2, -1);

    // Act
    // @ts-expect-error an object with only toString() does not implement ICoord
    const callWithInvalid = () => acceptCoord(invalid);
    // @ts-expect-error a primitive number does not implement ICoord
    const callWithPrimitive = () => acceptCoord(42);

    // Assert — compile-time check enforced by `npm run typecheck`
    expect(invalid.toString()).toBe('0,0');
    expect(callWithInvalid).toThrow(TypeError);
    expect(callWithPrimitive).toThrow(TypeError);
    expect(acceptCoord(valid)).toBe('2,-1');
  });
});
