import { Axis } from '../geometry/axis';
import type { IBoardGeometry } from '../geometry/board-geometry';
import type { ICoord } from '../geometry/coord';
import { Direction } from '../geometry/direction';
import { HexCoord } from '../geometry/hex-coord';
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

class TestCubeCoord implements ICoord {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly z: number,
  ) {}

  equals(other: ICoord): boolean {
    return (
      other instanceof TestCubeCoord &&
      this.x === other.x &&
      this.y === other.y &&
      this.z === other.z
    );
  }

  toString(): string {
    return `${this.x},${this.y},${this.z}`;
  }
}

const CubeAxisZ = new Axis('Z');
const CubeDirection = Object.freeze({
  POS_X: new Direction('+X'),
  NEG_X: new Direction('-X'),
  POS_Y: new Direction('+Y'),
  NEG_Y: new Direction('-Y'),
  POS_Z: new Direction('+Z'),
  NEG_Z: new Direction('-Z'),
});

class TestCubeGeometry implements IBoardGeometry<TestCubeCoord> {
  readonly origin = new TestCubeCoord(0, 0, 0);
  readonly directions = [
    CubeDirection.POS_X,
    CubeDirection.NEG_X,
    CubeDirection.POS_Y,
    CubeDirection.NEG_Y,
    CubeDirection.POS_Z,
    CubeDirection.NEG_Z,
  ];
  readonly axes = [CubeAxisZ];
  readonly rotationSteps = 4;

  neighbour(coord: TestCubeCoord, direction: Direction): TestCubeCoord {
    switch (direction) {
      case CubeDirection.POS_X:
        return new TestCubeCoord(coord.x + 1, coord.y, coord.z);
      case CubeDirection.NEG_X:
        return new TestCubeCoord(coord.x - 1, coord.y, coord.z);
      case CubeDirection.POS_Y:
        return new TestCubeCoord(coord.x, coord.y + 1, coord.z);
      case CubeDirection.NEG_Y:
        return new TestCubeCoord(coord.x, coord.y - 1, coord.z);
      case CubeDirection.POS_Z:
        return new TestCubeCoord(coord.x, coord.y, coord.z + 1);
      case CubeDirection.NEG_Z:
        return new TestCubeCoord(coord.x, coord.y, coord.z - 1);
      default:
        throw new RangeError(`Unknown cube direction: ${String(direction)}`);
    }
  }

  neighbours(coord: TestCubeCoord): TestCubeCoord[] {
    return this.directions.map((dir) => this.neighbour(coord, dir));
  }

  line(
    coord: TestCubeCoord,
    axis: Axis,
    isInside: (cell: TestCubeCoord) => boolean,
  ): TestCubeCoord[] {
    if (axis !== CubeAxisZ || !isInside(coord)) {
      return [];
    }
    let start = coord;
    while (isInside(this.neighbour(start, CubeDirection.NEG_Z))) {
      start = this.neighbour(start, CubeDirection.NEG_Z);
    }
    const cells: TestCubeCoord[] = [];
    for (
      let cell = start;
      isInside(cell);
      cell = this.neighbour(cell, CubeDirection.POS_Z)
    ) {
      cells.push(cell);
    }
    return cells;
  }

  ring(centre: TestCubeCoord, radius: number): TestCubeCoord[] {
    if (radius === 0) {
      return [centre];
    }
    return this.directions.map((dir) => {
      let cell = centre;
      for (let step = 0; step < radius; step++) {
        cell = this.neighbour(cell, dir);
      }
      return cell;
    });
  }

  rotate(coord: TestCubeCoord): TestCubeCoord {
    return coord;
  }
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
  const coord = new HexCoord(1, -2);

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
      board.place(HexCoord.ORIGIN, 'blue');

      // Act
      board.remove(HexCoord.ORIGIN);

      // Assert
      expect(board.cellAt(HexCoord.ORIGIN)).toBeUndefined();
    });

    it('should_throw_when_setting_cell_outside_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(2);

      // Act
      const place = () => board.place(new HexCoord(3, 0), 'red');

      // Assert
      expect(place).toThrow(RangeError);
    });

    it('should_throw_when_reading_cell_outside_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(2);

      // Act
      const read = () => board.cellAt(new HexCoord(0, 3));

      // Assert
      expect(read).toThrow(RangeError);
    });
  });

  describe('neighbourhood and axes', () => {
    it('should_return_six_neighbours_when_cell_is_centre', () => {
      // Arrange
      const board = radiusBoard<TestColor>(4);

      // Act
      const neighbours = board.neighbours(HexCoord.ORIGIN);

      // Assert
      expect(neighbours).toHaveLength(6);
    });

    it('should_return_three_neighbours_when_cell_is_corner_of_radius_4_board', () => {
      // Arrange
      const board = radiusBoard<TestColor>(4);

      // Act
      const neighbours = board.neighbours(new HexCoord(4, 0));

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
      const shape = BoardShape.of([0, 1, 3, 4].map((q) => new HexCoord(q, 0)));
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
        BoardShape.of([HexCoord.ORIGIN, new HexCoord(1, 0)]),
        geometry,
      );

      // Act
      const rotated = board.rotate(new HexCoord(1, 0), 1);

      // Assert
      expect(board.contains(rotated)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should_not_change_original_when_clone_is_modified', () => {
      // Arrange
      const original = radiusBoard<TestTile>(2);
      const tile = new TestTile(4);
      original.place(HexCoord.ORIGIN, tile);

      // Act
      const copy = original.clone();
      copy.remove(HexCoord.ORIGIN);
      copy.place(new HexCoord(1, 0), new TestTile(2));

      // Assert
      expect(original.cellAt(HexCoord.ORIGIN)).toBe(tile);
      expect(original.isEmpty(new HexCoord(1, 0))).toBe(true);
      expect(copy.isEmpty(HexCoord.ORIGIN)).toBe(true);
    });
  });

  describe('3D coordinate independence', () => {
    it('should_operate_board_with_3d_test_coord_when_custom_geometry_is_injected', () => {
      // Arrange
      const cubeGeometry = new TestCubeGeometry();
      const shape = BoardShape.ofRadius(cubeGeometry, 1);
      const board = new Board<TestColor, TestCubeCoord>(shape, cubeGeometry);
      const top = new TestCubeCoord(0, 0, 1);

      // Act
      board.place(top, 'red');
      const copy = board.clone();
      copy.remove(top);
      const centreNeighbours = board.neighbours(cubeGeometry.origin);
      const zLines = board.lines(CubeAxisZ);

      // Assert
      expect(board.cellAt(top)).toBe('red');
      expect(copy.isEmpty(top)).toBe(true);
      expect(centreNeighbours).toHaveLength(6);
      expect(zLines.some((line) => line.length === 3)).toBe(true);
    });
  });
});
