import { Coord } from '../geometry/coord';
import { HexAxis, HexGeometry } from '../geometry/hex-geometry';
import { Board } from './board';
import { BoardShape } from './board-shape';

// Test cell types, shaped like the real ones that arrive with each variant:
// Color (Lines), PieceId (Fit), ColorStack (Sort) and Tile (Merge).
type TestColor = 'red' | 'blue';
type TestPieceId = number;
class TestColorStack {
  constructor(readonly chips: readonly TestColor[]) {}
}
class TestTile {
  constructor(readonly value: number) {}
}

const geometry = new HexGeometry();

function radiusBoard<TCell extends NonNullable<unknown>>(
  radius: number,
): Board<TCell> {
  return new Board<TCell>(BoardShape.ofRadius(geometry, radius), geometry);
}

function storesCell<TCell extends NonNullable<unknown>>(cell: TCell): void {
  // Arrange
  const board = radiusBoard<TCell>(4);
  const coord = new Coord(1, -2);

  // Act
  board.place(coord, cell);

  // Assert
  expect(board.cellAt(coord)).toBe(cell);
  expect(board.isEmpty(coord)).toBe(false);
}

describe('Board', () => {
  describe('cells', () => {
    it('should_store_cell_when_set_inside_board (Color)', () => {
      storesCell<TestColor>('red');
    });

    it('should_store_cell_when_set_inside_board (PieceId)', () => {
      storesCell<TestPieceId>(7);
    });

    it('should_store_cell_when_set_inside_board (ColorStack)', () => {
      storesCell<TestColorStack>(new TestColorStack(['red', 'blue']));
    });

    it('should_store_cell_when_set_inside_board (Tile)', () => {
      storesCell<TestTile>(new TestTile(2048));
    });

    it('should_be_empty_when_board_is_new', () => {
      // Arrange / Act
      const board = radiusBoard<TestColor>(2);

      // Assert
      expect(board.shape.coords.every((coord) => board.isEmpty(coord))).toBe(
        true,
      );
    });

    it('should_be_empty_when_cell_is_cleared', () => {
      // Arrange
      const board = radiusBoard<TestColor>(2);
      board.place(Coord.ORIGIN, 'blue');

      // Act
      board.remove(Coord.ORIGIN);

      // Assert
      expect(board.cellAt(Coord.ORIGIN)).toBeUndefined();
    });

    it('should_throw_when_setting_cell_outside_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(2);

      // Act
      const place = () => board.place(new Coord(3, 0), 'red');

      // Assert
      expect(place).toThrow(RangeError);
    });

    it('should_throw_when_reading_cell_outside_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(2);

      // Act
      const read = () => board.cellAt(new Coord(0, 3));

      // Assert
      expect(read).toThrow(RangeError);
    });
  });

  describe('neighbourhood and axes', () => {
    it('should_return_six_neighbours_when_cell_is_centre', () => {
      // Arrange
      const board = radiusBoard<TestColor>(4);

      // Act
      const neighbours = board.neighbours(Coord.ORIGIN);

      // Assert
      expect(neighbours).toHaveLength(6);
    });

    it('should_return_three_neighbours_when_cell_is_corner_of_radius_4_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(4);

      // Act
      const neighbours = board.neighbours(new Coord(4, 0));

      // Assert
      expect(neighbours.map(String).sort()).toEqual(['3,0', '3,1', '4,-1']);
    });

    it.each([HexAxis.Q, HexAxis.R, HexAxis.S])(
      'should_return_nine_lines_per_axis_when_board_has_radius_4 (%s)',
      (axis) => {
        // Arrange
        const board = radiusBoard<TestColor>(4);

        // Act
        const lines = board.lines(axis);

        // Assert
        expect(lines.map((line) => line.length).sort()).toEqual([
          5, 5, 6, 6, 7, 7, 8, 8, 9,
        ]);
        expect(new Set(lines.flat().map(String)).size).toBe(61);
      },
    );

    it('should_stop_line_at_gap_when_shape_is_free_form', () => {
      // Arrange: one row with a gap at (2, 0)
      const shape = BoardShape.of([0, 1, 3, 4].map((q) => new Coord(q, 0)));
      const board = new Board<TestPieceId>(shape, geometry);

      // Act
      const lines = board.lines(HexAxis.R);

      // Assert
      expect(lines.map((line) => line.map(String))).toEqual([
        ['0,0', '1,0'],
        ['3,0', '4,0'],
      ]);
    });
  });

  describe('rotation', () => {
    it('should_keep_every_cell_inside_when_rotating_hexagon_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(4);

      // Act
      const rotated = board.shape.coords.map((coord) => board.rotate(coord, 1));

      // Assert
      expect(rotated.every((coord) => board.contains(coord))).toBe(true);
    });

    it('should_leave_board_when_rotating_free_form_cell', () => {
      // Arrange
      const board = new Board<TestPieceId>(
        BoardShape.of([Coord.ORIGIN, new Coord(1, 0)]),
        geometry,
      );

      // Act
      const rotated = board.rotate(new Coord(1, 0), 1);

      // Assert
      expect(board.contains(rotated)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should_not_change_original_when_clone_is_modified', () => {
      // Arrange
      const original = radiusBoard<TestTile>(2);
      const tile = new TestTile(4);
      original.place(Coord.ORIGIN, tile);

      // Act
      const copy = original.clone();
      copy.remove(Coord.ORIGIN);
      copy.place(new Coord(1, 0), new TestTile(2));

      // Assert
      expect(original.cellAt(Coord.ORIGIN)).toBe(tile);
      expect(original.isEmpty(new Coord(1, 0))).toBe(true);
      expect(copy.isEmpty(Coord.ORIGIN)).toBe(true);
    });
  });
});
