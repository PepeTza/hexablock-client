import { HexCoord } from '../hex/hex-coord';
import { HexGeometry } from '../hex/hex-geometry';
import { parseHexCell } from '../hex/hex-piece-catalog';
import { PieceCatalog } from './piece-catalog';
import { PieceShape } from './piece-shape';

const geometry = new HexGeometry();
const hex = (q: number, r: number): HexCoord => new HexCoord(q, r);
const shape = (id: string, cells: HexCoord[]): PieceShape<HexCoord> =>
  PieceShape.of(id, cells, geometry);

describe('PieceCatalog', () => {
  it('should_reject_catalog_when_ids_repeat', () => {
    // Arrange
    const shapes = [
      shape('p1', [hex(0, 0)]),
      shape('p1', [hex(0, 0), hex(1, 0)]),
    ];

    // Act
    const create = () => PieceCatalog.of(shapes, 5);

    // Assert
    expect(create).toThrow(/repeats the id p1/);
  });

  it('should_reject_catalog_when_two_shapes_are_rotations', () => {
    // Arrange
    const shapes = [
      shape('east', [hex(0, 0), hex(1, 0)]),
      shape('south-east', [hex(0, 0), hex(0, 1)]),
    ];

    // Act
    const create = () => PieceCatalog.of(shapes, 5);

    // Assert
    expect(create).toThrow(/east and south-east are the same shape turned/);
  });

  it('should_reject_catalog_when_shape_exceeds_max_cells', () => {
    // Arrange
    const shapes = [shape('p3', [hex(0, 0), hex(1, 0), hex(-1, 0)])];

    // Act
    const create = () => PieceCatalog.of(shapes, 2);

    // Assert
    expect(create).toThrow(/has 3 cells; the maximum is 2/);
  });

  it('should_report_clear_error_when_cell_is_not_integer_pair', () => {
    // Arrange
    const data = {
      shapes: [
        { id: 'p1', cells: [[0, 0]] },
        {
          id: 'p2',
          cells: [
            [0, 0],
            [1.5, 0],
          ],
        },
      ],
    };

    // Act
    const load = () => PieceCatalog.fromData(data, geometry, parseHexCell, 5);

    // Assert
    expect(load).toThrow(
      'shapes[1].cells[1] must be a [q, r] pair of integers',
    );
  });
  it('should_return_shape_when_id_exists', () => {
    // Arrange
    const single = shape('p1', [hex(0, 0)]);
    const catalog = PieceCatalog.of([single], 5);

    // Act
    const found = catalog.get('p1');

    // Assert
    expect(found).toBe(single);
  });

  it('should_throw_when_id_is_unknown', () => {
    // Arrange
    const catalog = PieceCatalog.of([shape('p1', [hex(0, 0)])], 5);

    // Act
    const get = () => catalog.get('p9');

    // Assert
    expect(get).toThrow(/no piece shape p9/);
  });
});
