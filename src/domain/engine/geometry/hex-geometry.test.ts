import { Coord } from './coord';
import { Axis } from './axis';
import { Direction } from './direction';
import { HexAxis, HexDirection, HexGeometry } from './hex-geometry';

/** Inside a hexagonal board of radius 4 (61 cells) centred on the origin. */
function insideRadius4(cell: Coord): boolean {
  return Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.s)) <= 4;
}

const keys = (cells: Coord[]): string[] => cells.map(String);

describe('HexGeometry', () => {
  describe('directions and axes', () => {
    it('should_declare_six_directions_and_three_axes_when_geometry_is_hexagonal', () => {
      // Arrange / Act
      const geometry = new HexGeometry();

      // Assert
      expect(geometry.directions.map(String)).toEqual([
        'EAST',
        'SOUTH_EAST',
        'SOUTH_WEST',
        'WEST',
        'NORTH_WEST',
        'NORTH_EAST',
      ]);
      expect(geometry.axes.map(String)).toEqual(['Q', 'R', 'S']);
    });

    it('should_throw_when_direction_does_not_belong_to_geometry', () => {
      // Arrange
      const geometry = new HexGeometry();
      const squareNorth = new Direction('NORTH');

      // Act
      const move = () => geometry.neighbour(Coord.ORIGIN, squareNorth);

      // Assert
      expect(move).toThrow(RangeError);
    });

    it('should_throw_when_axis_does_not_belong_to_geometry', () => {
      // Arrange
      const geometry = new HexGeometry();
      const squareRow = new Axis('ROW');

      // Act
      const line = () => geometry.line(Coord.ORIGIN, squareRow, () => true);

      // Assert
      expect(line).toThrow(RangeError);
    });
  });

  describe('neighbours', () => {
    it.each([
      [HexDirection.EAST, '3,-1'],
      [HexDirection.SOUTH_EAST, '2,0'],
      [HexDirection.SOUTH_WEST, '1,0'],
      [HexDirection.WEST, '1,-1'],
      [HexDirection.NORTH_WEST, '2,-2'],
      [HexDirection.NORTH_EAST, '3,-2'],
    ])(
      'should_return_offset_cell_when_moving_one_step_in_each_direction (%s)',
      (direction, expected) => {
        // Arrange
        const geometry = new HexGeometry();
        const cell = new Coord(2, -1);

        // Act
        const neighbour = geometry.neighbour(cell, direction);

        // Assert
        expect(neighbour.toString()).toBe(expected);
      },
    );

    it('should_return_six_distinct_neighbours_when_cell_is_any_coord', () => {
      // Arrange
      const geometry = new HexGeometry();
      const cell = new Coord(-3, 5);

      // Act
      const neighbours = geometry.neighbours(cell);

      // Assert
      expect(neighbours).toHaveLength(6);
      expect(new Set(keys(neighbours)).size).toBe(6);
      expect(neighbours.some((neighbour) => neighbour.equals(cell))).toBe(
        false,
      );
    });
  });

  describe('line', () => {
    it.each([
      [HexAxis.R, '-4,0', '4,0'],
      [HexAxis.Q, '0,-4', '0,4'],
      [HexAxis.S, '-4,4', '4,-4'],
    ])(
      'should_return_nine_ordered_cells_when_line_crosses_centre_of_radius_4_board (%s)',
      (axis, first, last) => {
        // Arrange
        const geometry = new HexGeometry();

        // Act
        const line = geometry.line(Coord.ORIGIN, axis, insideRadius4);

        // Assert
        expect(line).toHaveLength(9);
        expect(line[0]?.toString()).toBe(first);
        expect(line[8]?.toString()).toBe(last);
        expect(line.some((cell) => cell.equals(Coord.ORIGIN))).toBe(true);
      },
    );

    it('should_return_five_cells_when_line_runs_along_edge_of_radius_4_board', () => {
      // Arrange
      const geometry = new HexGeometry();
      const edgeCell = new Coord(2, -4);

      // Act
      const line = geometry.line(edgeCell, HexAxis.R, insideRadius4);

      // Assert
      expect(keys(line)).toEqual(['0,-4', '1,-4', '2,-4', '3,-4', '4,-4']);
    });

    it('should_return_empty_line_when_coord_is_outside', () => {
      // Arrange
      const geometry = new HexGeometry();
      const outside = new Coord(5, 0);

      // Act
      const line = geometry.line(outside, HexAxis.R, insideRadius4);

      // Assert
      expect(line).toEqual([]);
    });
  });

  describe('ring', () => {
    it('should_return_only_centre_when_ring_radius_is_zero', () => {
      // Arrange
      const geometry = new HexGeometry();
      const centre = new Coord(1, 1);

      // Act
      const ring = geometry.ring(centre, 0);

      // Assert
      expect(keys(ring)).toEqual(['1,1']);
    });

    it.each([1, 2, 3])(
      'should_return_six_times_radius_cells_when_ring_radius_is_positive (%i)',
      (radius) => {
        // Arrange
        const geometry = new HexGeometry();

        // Act
        const ring = geometry.ring(Coord.ORIGIN, radius);

        // Assert
        expect(ring).toHaveLength(6 * radius);
        expect(new Set(keys(ring)).size).toBe(6 * radius);
        expect(
          ring.every(
            (cell) =>
              Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.s)) ===
              radius,
          ),
        ).toBe(true);
      },
    );

    it('should_return_neighbours_when_ring_radius_is_one', () => {
      // Arrange
      const geometry = new HexGeometry();
      const centre = new Coord(2, -3);

      // Act
      const ring = geometry.ring(centre, 1);

      // Assert
      expect(keys(ring)).toEqual(keys(geometry.neighbours(centre)));
    });

    it('should_throw_when_ring_radius_is_negative', () => {
      // Arrange
      const geometry = new HexGeometry();

      // Act
      const ring = () => geometry.ring(Coord.ORIGIN, -1);

      // Assert
      expect(ring).toThrow(RangeError);
    });
  });

  describe('rotate', () => {
    it('should_rotate_east_neighbour_to_south_east_when_rotating_one_step', () => {
      // Arrange
      const geometry = new HexGeometry();
      const east = geometry.neighbour(Coord.ORIGIN, HexDirection.EAST);

      // Act
      const rotated = geometry.rotate(east, 1);

      // Assert
      expect(rotated).toEqual(
        geometry.neighbour(Coord.ORIGIN, HexDirection.SOUTH_EAST),
      );
    });

    it('should_return_same_coord_when_rotating_six_steps', () => {
      // Arrange
      const geometry = new HexGeometry();
      const cell = new Coord(3, -1);

      // Act
      const rotated = geometry.rotate(cell, 6);

      // Assert
      expect(rotated).toEqual(cell);
    });

    it('should_rotate_counter_clockwise_when_steps_are_negative', () => {
      // Arrange
      const geometry = new HexGeometry();
      const cell = new Coord(3, -1);

      // Act
      const rotated = geometry.rotate(cell, -1);

      // Assert
      expect(geometry.rotate(rotated, 1)).toEqual(cell);
      expect(rotated).toEqual(geometry.rotate(cell, 5));
    });

    it('should_throw_when_rotation_steps_are_not_an_integer', () => {
      // Arrange
      const geometry = new HexGeometry();

      // Act
      const rotate = () => geometry.rotate(Coord.ORIGIN, 1.5);

      // Assert
      expect(rotate).toThrow(RangeError);
    });

    it('should_rotate_around_centre_when_centre_is_given', () => {
      // Arrange
      const geometry = new HexGeometry();
      const centre = new Coord(2, 3);
      const eastOfCentre = new Coord(3, 3);

      // Act
      const rotated = geometry.rotate(eastOfCentre, 1, centre);

      // Assert
      expect(rotated.toString()).toBe('2,4');
    });
  });
});
