import { Coord } from '../geometry/coord';
import { HexGeometry } from '../geometry/hex-geometry';
import { BoardShape } from './board-shape';

describe('BoardShape', () => {
  it('should_have_61_cells_when_radius_is_4', () => {
    // Arrange
    const geometry = new HexGeometry();

    // Act
    const shape = BoardShape.ofRadius(geometry, 4);

    // Assert
    expect(shape.size).toBe(61);
    expect(new Set(shape.coords.map(String)).size).toBe(61);
  });

  it('should_have_19_cells_when_radius_is_2', () => {
    // Arrange
    const geometry = new HexGeometry();

    // Act
    const shape = BoardShape.ofRadius(geometry, 2);

    // Assert
    expect(shape.size).toBe(19);
    expect(shape.contains(new Coord(2, -2))).toBe(true);
    expect(shape.contains(new Coord(3, 0))).toBe(false);
  });

  it('should_throw_when_radius_is_negative', () => {
    // Arrange
    const geometry = new HexGeometry();

    // Act
    const create = () => BoardShape.ofRadius(geometry, -1);

    // Assert
    expect(create).toThrow(RangeError);
  });

  it('should_contain_only_given_cells_when_shape_is_free_form', () => {
    // Arrange
    const cells = [new Coord(0, 0), new Coord(1, 0), new Coord(5, -3)];

    // Act
    const shape = BoardShape.of(cells);

    // Assert
    expect(shape.size).toBe(3);
    expect(shape.contains(new Coord(5, -3))).toBe(true);
    expect(shape.contains(new Coord(2, 0))).toBe(false);
  });

  it('should_ignore_duplicates_when_free_form_repeats_a_coord', () => {
    // Arrange
    const cells = [new Coord(0, 0), new Coord(1, 0), new Coord(0, 0)];

    // Act
    const shape = BoardShape.of(cells);

    // Assert
    expect(shape.size).toBe(2);
  });

  it('should_throw_when_free_form_shape_is_empty', () => {
    // Arrange / Act
    const create = () => BoardShape.of([]);

    // Assert
    expect(create).toThrow(RangeError);
  });
});
