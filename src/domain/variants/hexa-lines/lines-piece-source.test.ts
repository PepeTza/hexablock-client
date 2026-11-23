import { SeededRandom } from '../../engine/random/seeded-random';
import { createLinesPieceSource } from './lines-piece-source';

describe('createLinesPieceSource', () => {
  it('should_deal_rotated_pieces_when_drawing_from_the_seeded_catalog', () => {
    // Arrange
    const source = createLinesPieceSource(new SeededRandom(42));

    // Act
    const pieces = source.draw(24);

    // Assert
    expect(pieces).toHaveLength(24);
    expect(new Set(pieces.map((piece) => piece.rotation))).toEqual(
      new Set([0, 1, 2, 3, 4, 5]),
    );
    expect(pieces.some((piece) => piece.shape.size > 1)).toBe(true);
  });

  it('should_favour_the_configured_shape_when_its_weight_dominates', () => {
    // Arrange
    const weights = new Map([['p2-01', 10_000]]);
    const source = createLinesPieceSource(new SeededRandom(42), weights);

    // Act
    const pieces = source.draw(12);

    // Assert
    expect(pieces.map((piece) => piece.shape.id)).toEqual(
      Array<string>(12).fill('p2-01'),
    );
    expect(new Set(pieces.map((piece) => piece.rotation)).size).toBeGreaterThan(
      1,
    );
  });

  it('should_reject_invalid_weights_when_configuring_the_source', () => {
    // Arrange
    const random = new SeededRandom(42);
    const weights = new Map([['p2-01', 0]]);

    // Act
    const configure = () => createLinesPieceSource(random, weights);

    // Assert
    expect(configure).toThrow(RangeError);
  });

  it('should_reject_unknown_shape_ids_when_configuring_the_source', () => {
    // Arrange
    const random = new SeededRandom(42);
    const weights = new Map([['missing', 1]]);

    // Act
    const configure = () => createLinesPieceSource(random, weights);

    // Assert
    expect(configure).toThrow('The catalog has no piece shape missing');
  });
});
