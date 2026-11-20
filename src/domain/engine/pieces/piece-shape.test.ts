import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { PieceShape } from './piece-shape';

const geometry = new HexGeometry();
const hex = (q: number, r: number): HexCoord => new HexCoord(q, r);

/** A line of three cells to the east, then one cell north-west of its end. */
const HOOK = [hex(0, 0), hex(1, 0), hex(2, 0), hex(2, -1)];

describe('PieceShape', () => {
  it('should_reject_shape_when_cells_are_not_connected', () => {
    // Arrange
    const cells = [hex(0, 0), hex(2, 0)];

    // Act
    const create = () => PieceShape.of('gap', cells, geometry);

    // Assert
    expect(create).toThrow(/joined by their sides/);
  });

  it('should_reject_shape_when_origin_is_not_a_cell', () => {
    // Arrange
    const cells = [hex(1, 0), hex(2, 0)];

    // Act
    const create = () => PieceShape.of('off-centre', cells, geometry);

    // Assert
    expect(create).toThrow(/centre of rotation/);
  });

  it('should_reject_shape_when_a_cell_is_repeated', () => {
    // Arrange
    const cells = [hex(0, 0), hex(1, 0), hex(0, 0)];

    // Act
    const create = () => PieceShape.of('twice', cells, geometry);

    // Assert
    expect(create).toThrow(/repeats a cell/);
  });

  it('should_reject_shape_when_empty', () => {
    // Arrange
    const cells: HexCoord[] = [];

    // Act
    const create = () => PieceShape.of('empty', cells, geometry);

    // Assert
    expect(create).toThrow(/at least one cell/);
  });

  it('should_match_when_shape_is_rotated_copy', () => {
    // Arrange
    const shape = PieceShape.of('hook', HOOK, geometry);
    // Turned twice (120°) and moved so another cell is the centre.
    const turned = HOOK.map((cell) => geometry.rotate(cell, 2));
    const centred = turned.map((cell) =>
      geometry.translate(cell, turned[1] ?? hex(0, 0), hex(0, 0)),
    );
    const copy = PieceShape.of('hook-copy', centred, geometry);

    // Act
    const matches = copy.isRotationOf(shape);

    // Assert
    expect(matches).toBe(true);
  });

  it('should_not_match_when_shape_is_mirror_image', () => {
    // Arrange
    const shape = PieceShape.of('hook', HOOK, geometry);
    // The same hook with its last cell south-west of the end instead.
    const mirror = PieceShape.of(
      'hook-mirror',
      [hex(0, 0), hex(1, 0), hex(2, 0), hex(1, 1)],
      geometry,
    );

    // Act
    const matches = mirror.isRotationOf(shape);

    // Assert
    expect(matches).toBe(false);
  });
});
