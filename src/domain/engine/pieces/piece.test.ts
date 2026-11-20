import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { Piece } from './piece';
import { PieceShape } from './piece-shape';

const geometry = new HexGeometry();
const hex = (q: number, r: number): HexCoord => new HexCoord(q, r);
const keys = (cells: readonly HexCoord[]): string[] => cells.map(String).sort();

/** A straight line of three cells, west to east, centred on its middle cell. */
const line = PieceShape.of(
  'line-3',
  [hex(0, 0), hex(-1, 0), hex(1, 0)],
  geometry,
);

describe('Piece', () => {
  it('should_turn_line_to_south_east_when_rotated_once', () => {
    // Arrange
    const piece = Piece.of(line);

    // Act
    const cells = piece.rotate(1).cells();

    // Assert
    expect(keys(cells)).toEqual(keys([hex(0, -1), hex(0, 0), hex(0, 1)]));
  });

  it('should_return_same_cells_when_rotated_full_turn', () => {
    // Arrange
    const piece = Piece.of(line);

    // Act
    const turned = piece.rotate(geometry.rotationSteps);

    // Assert
    expect(turned.rotation).toBe(0);
    expect(keys(turned.cells())).toEqual(keys(piece.cells()));
  });

  it('should_place_cells_around_anchor_when_placed_at_cell', () => {
    // Arrange
    const piece = Piece.of(line, 1);

    // Act
    const cells = piece.cellsAt(hex(3, -2));

    // Assert
    expect(keys(cells)).toEqual(keys([hex(3, -3), hex(3, -2), hex(3, -1)]));
  });

  it('should_not_change_original_when_rotated', () => {
    // Arrange
    const piece = Piece.of(line);

    // Act
    piece.rotate(1);

    // Assert
    expect(piece.rotation).toBe(0);
    expect(keys(piece.cells())).toEqual(keys(line.cells));
  });
});
