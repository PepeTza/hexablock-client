import { LevelBuilder } from '../../content/level-builder';
import { FitLevelValidator } from './fit-level-validator';

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
  const validator = new FitLevelValidator();

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
