import { Axis } from '../geometry/axis';
import type { IBoardGeometry } from '../geometry/board-geometry';
import type { ICoord } from '../geometry/coord';
import { Direction } from '../geometry/direction';
import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { BoardShape } from './board-shape';

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

class FakeCubeGeometry implements IBoardGeometry<TestCubeCoord> {
  readonly origin = new TestCubeCoord(0, 0, 0);
  readonly directions = [new Direction('UP'), new Direction('DOWN')];
  readonly axes = [new Axis('Z')];

  neighbour(coord: TestCubeCoord): TestCubeCoord {
    return coord;
  }

  neighbours(): TestCubeCoord[] {
    return [];
  }

  line(): TestCubeCoord[] {
    return [];
  }

  translate(
    coord: TestCubeCoord,
    from: TestCubeCoord,
    to: TestCubeCoord,
  ): TestCubeCoord {
    return new TestCubeCoord(
      coord.x - from.x + to.x,
      coord.y - from.y + to.y,
      coord.z - from.z + to.z,
    );
  }

  ring(centre: TestCubeCoord, radius: number): TestCubeCoord[] {
    if (radius === 0) {
      return [centre];
    }
    return [
      new TestCubeCoord(centre.x + radius, centre.y, centre.z),
      new TestCubeCoord(centre.x - radius, centre.y, centre.z),
      new TestCubeCoord(centre.x, centre.y + radius, centre.z),
      new TestCubeCoord(centre.x, centre.y - radius, centre.z),
      new TestCubeCoord(centre.x, centre.y, centre.z + radius),
      new TestCubeCoord(centre.x, centre.y, centre.z - radius),
    ];
  }
}

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
    expect(shape.contains(new HexCoord(2, -2))).toBe(true);
    expect(shape.contains(new HexCoord(3, 0))).toBe(false);
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
    const cells = [new HexCoord(0, 0), new HexCoord(1, 0), new HexCoord(5, -3)];

    // Act
    const shape = BoardShape.of(cells);

    // Assert
    expect(shape.size).toBe(3);
    expect(shape.contains(new HexCoord(5, -3))).toBe(true);
    expect(shape.contains(new HexCoord(2, 0))).toBe(false);
  });

  it('should_ignore_duplicates_when_free_form_repeats_a_coord', () => {
    // Arrange
    const cells = [new HexCoord(0, 0), new HexCoord(1, 0), new HexCoord(0, 0)];

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

  it('should_build_shape_from_custom_coord_geometry_when_not_hexagonal', () => {
    // Arrange
    const cubeGeometry = new FakeCubeGeometry();

    // Act
    const shape = BoardShape.ofRadius(cubeGeometry, 1);

    // Assert
    expect(shape.size).toBe(7);
    expect(shape.contains(new TestCubeCoord(0, 0, 1))).toBe(true);
    expect(shape.contains(new TestCubeCoord(1, 1, 1))).toBe(false);
  });

  describe('rotation', () => {
    it('should_keep_every_cell_inside_when_rotating_hexagon_shape', () => {
      // Arrange
      const geometry = new HexGeometry();
      const shape = BoardShape.ofRadius(geometry, 4);

      // Act
      const rotated = shape.coords.map((coord) => geometry.rotate(coord, 1));

      // Assert
      expect(rotated.every((coord) => shape.contains(coord))).toBe(true);
    });

    it('should_leave_shape_when_rotating_free_form_cell', () => {
      // Arrange
      const geometry = new HexGeometry();
      const shape = BoardShape.of([HexCoord.ORIGIN, new HexCoord(1, 0)]);

      // Act
      const rotated = geometry.rotate(new HexCoord(1, 0), 1);

      // Assert
      expect(shape.contains(rotated)).toBe(false);
    });
  });
});
