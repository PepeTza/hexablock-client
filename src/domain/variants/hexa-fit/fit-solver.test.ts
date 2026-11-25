import { HexCoord } from '../../engine/hex/hex-coord';
import { loadHexPieceCatalog } from '../../engine/hex/hex-piece-catalog';
import { Piece } from '../../engine/pieces/piece';
import {
  PieceShape,
  type PieceGeometry,
} from '../../engine/pieces/piece-shape';
import { solveFitFigure } from './fit-solver';

describe('solveFitFigure', () => {
  const catalog = loadHexPieceCatalog();

  it('should_return_a_cover_when_the_catalog_piece_matches_the_figure', () => {
    // Arrange
    const piece = Piece.of(catalog.get('p3-01'), 2);
    const figure = piece.cellsAt(new HexCoord(4, -2));

    // Act
    const solution = solveFitFigure(figure, [Piece.of(piece.shape)]);

    // Assert
    expect(solution).toHaveLength(1);
    expect(
      solution?.flatMap(({ cells }) => cells.map((cell) => cell.key())).sort(),
    ).toEqual(figure.map((cell) => cell.key()).sort());
  });

  it('should_reject_when_the_total_piece_area_differs_from_the_figure', () => {
    // Arrange
    const figure = [new HexCoord(0, 0)];
    const piece = Piece.of(catalog.get('p3-01'));

    // Act
    const solution = solveFitFigure(figure, [piece]);

    // Assert
    expect(solution).toBeNull();
  });

  it('should_reject_when_equal_area_has_no_legal_cover', () => {
    // Arrange
    const figure = [new HexCoord(0, 0), new HexCoord(1, 0), new HexCoord(2, 0)];
    const bentPiece = Piece.of(catalog.get('p3-01'));

    // Act
    const solution = solveFitFigure(figure, [bentPiece]);

    // Assert
    expect(solution).toBeNull();
  });
});

it('should_use_each_piece_copy_once_when_the_figure_uses_non_hex_coordinates', () => {
  // Arrange
  const position = (column: number) => ({ column, key: () => String(column) });
  const origin = position(0);
  const geometry: PieceGeometry<typeof origin> = {
    origin,
    directions: [],
    axes: [],
    rotationSteps: 2,
    neighbour: () => {
      throw new RangeError('No directions');
    },
    neighbours: () => [],
    line: () => [],
    ring: (centre, radius) => (radius === 0 ? [centre] : []),
    translate: (coord, from, to) =>
      position(coord.column - from.column + to.column),
    rotate: (coord) => coord,
  };
  const single = Piece.of(PieceShape.of('single', [origin], geometry));

  // Act
  const solution = solveFitFigure([position(1), position(2)], [single, single]);

  // Assert
  expect(solution?.map(({ pieceIndex }) => pieceIndex)).toEqual([0, 1]);
  expect(
    solution?.flatMap(({ cells }) => cells.map((cell) => cell.key())),
  ).toEqual(['1', '2']);
});
