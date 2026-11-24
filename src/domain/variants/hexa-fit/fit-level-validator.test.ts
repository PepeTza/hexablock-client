import { PieceCatalog } from '../../engine/pieces/piece-catalog';
import {
  PieceShape,
  type PieceGeometry,
} from '../../engine/pieces/piece-shape';
import { LevelBuilder } from '../../content/level-builder';
import { FitLevelValidator } from './fit-level-validator';
import { createHexFitLevelValidator } from './hex-fit-level-validator';

const level = (figure: unknown, pieces: readonly string[]) =>
  LevelBuilder.fromData({
    id: 'fit-example',
    gameId: 'hexa-fit',
    order: 1,
    schemaVersion: 1,
    publishedAt: '2026-11-23T04:00:00Z',
    spec: {
      figure,
      pieces,
      starThresholds: { twoStars: 600, threeStars: 850 },
    },
  });

describe('FitLevelValidator', () => {
  const validator = createHexFitLevelValidator();

  it('should_return_a_solution_when_the_catalog_covers_the_figure', () => {
    const result = validator.validate(
      level(
        [
          { q: 0, r: 0 },
          { q: 1, r: -1 },
          { q: -1, r: 0 },
        ],
        ['p3-01'],
      ),
    );
    expect(result).toMatchObject({
      valid: true,
      solution: [{ pieceIndex: 0 }],
    });
  });

  it('should_report_the_piece_field_when_the_areas_differ', () => {
    const result = validator.validate(level([{ q: 0, r: 0 }], ['p3-01']));
    expect(result).toMatchObject({
      valid: false,
      errors: [{ field: 'spec.pieces' }],
    });
  });

  it('should_report_the_figure_when_two_cells_are_disconnected', () => {
    const result = validator.validate(
      level(
        [
          { q: 0, r: 0 },
          { q: 2, r: 0 },
        ],
        ['p1-01', 'p1-01'],
      ),
    );
    expect(result).toMatchObject({
      valid: false,
      errors: [{ field: 'spec.figure' }],
    });
  });
});

it('should_find_a_cover_when_the_geometry_catalog_and_parser_are_injected', () => {
  // Arrange
  const cell = { index: 0, key: () => '0' };
  const geometry: PieceGeometry<typeof cell> = {
    origin: cell,
    directions: [],
    axes: [],
    rotationSteps: 2,
    neighbour: () => {
      throw new RangeError('No directions');
    },
    neighbours: () => [],
    line: () => [],
    ring: (centre, radius) => (radius === 0 ? [centre] : []),
    translate: (_coord, _from, to) => to,
    rotate: (coord) => coord,
  };
  const shape = PieceShape.of('single', [cell], geometry);
  const catalog = PieceCatalog.of([shape], 1);
  const validator = new FitLevelValidator(geometry, catalog, (raw: unknown) =>
    raw === 0 ? cell : null,
  );

  // Act
  const result = validator.validate(level([0], ['single']));

  // Assert
  expect(result).toMatchObject({
    valid: true,
    solution: [{ pieceIndex: 0, anchor: cell, cells: [cell] }],
  });
});
