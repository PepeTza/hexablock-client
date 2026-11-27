import { PieceCatalog } from '../../engine/pieces/piece-catalog';
import {
  PieceShape,
  type PieceGeometry,
} from '../../engine/pieces/piece-shape';
import { LevelBuilder } from '../../content/level-builder';
import { FitLevelValidator } from './fit-level-validator';
import { createHexFitLevelValidator } from './hex-fit-level-validator';

const level = (
  figure: unknown,
  pieces: readonly string[],
  extra: Record<string, unknown> = {},
) =>
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
      ...extra,
    },
  });

describe('FitLevelValidator', () => {
  const validator = createHexFitLevelValidator();

  it.each([
    { field: 'spec', extra: { notes: 'extra' } },
    { field: 'spec.figure[0]', extra: { figure: [{ q: 0, r: 0, s: 0 }] } },
    {
      field: 'spec.starThresholds',
      extra: { starThresholds: { twoStars: 600, threeStars: 850, oneStar: 0 } },
    },
  ])(
    'should_report $field when it contains unknown fields',
    ({ field, extra }) => {
      // Arrange
      const candidate = level([{ q: 0, r: 0 }], ['p1-01'], extra);

      // Act
      const result = validator.validate(candidate);

      // Assert
      expect(result).toMatchObject({ valid: false, errors: [{ field }] });
    },
  );

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

  it.each([null, undefined, [], 'invalid', 42])(
    'should_report_spec_when_spec_is_not_a_plain_object (%p)',
    (rawSpec) => {
      // Arrange / Act
      const result = validator.validateSpec(rawSpec);

      // Assert
      expect(result).toMatchObject({
        valid: false,
        errors: [{ field: 'spec' }],
      });
    },
  );

  it('should_report_the_figure_when_cells_repeat', () => {
    // Arrange
    const candidate = level(
      [
        { q: 0, r: 0 },
        { q: 0, r: 0 },
      ],
      ['p1-01', 'p1-01'],
    );

    // Act
    const result = validator.validate(candidate);

    // Assert
    expect(result).toMatchObject({
      valid: false,
      errors: [{ field: 'spec.figure' }],
    });
  });

  it('should_allow_repeated_piece_ids_when_they_cover_the_figure', () => {
    // Arrange
    const candidate = level(
      [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ],
      ['p1-01', 'p1-01'],
    );

    // Act
    const result = validator.validate(candidate);

    // Assert
    expect(result).toMatchObject({
      valid: true,
      solution: [{ pieceIndex: 0 }, { pieceIndex: 1 }],
    });
  });

  it.each([
    { twoStars: 0, threeStars: 100 },
    { twoStars: 600, threeStars: 600 },
    { twoStars: 600, threeStars: 500 },
    { twoStars: 1.5, threeStars: 850 },
  ])(
    'should_report_star_thresholds_when_values_are_invalid (%p)',
    (starThresholds) => {
      // Arrange
      const candidate = level([{ q: 0, r: 0 }], ['p1-01'], { starThresholds });

      // Act
      const result = validator.validate(candidate);

      // Assert
      expect(result).toMatchObject({
        valid: false,
        errors: [{ field: 'spec.starThresholds' }],
      });
    },
  );
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
