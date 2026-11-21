import { SeededRandom } from '../random/seeded-random';
import { RandomPieceSource } from './random-piece-source';

describe('RandomPieceSource', () => {
  it('should_produce_identical_piece_sequences_when_using_the_same_seed', () => {
    // Arrange
    const pool = ['p1-01', 'p2-01', 'p3-01', 'p4-01'];
    const first = RandomPieceSource.uniform(pool, new SeededRandom(42));
    const second = RandomPieceSource.uniform(pool, new SeededRandom(42));

    // Act
    const sequenceA = first.draw(20);
    const sequenceB = second.draw(20);

    // Assert
    expect(sequenceA).toEqual(sequenceB);
    expect(new Set(sequenceA).size).toBeGreaterThan(1);
  });

  it('should_always_have_next_and_draw_requested_count_when_drawing', () => {
    // Arrange
    const source = RandomPieceSource.uniform(['only'], new SeededRandom(1));

    // Act
    const zero = source.draw(0);
    const three = source.draw(3);

    // Assert
    expect(zero).toEqual([]);
    expect(three).toEqual(['only', 'only', 'only']);
    expect(source.hasNext()).toBe(true);
  });

  it('should_favour_higher_weighted_pieces_when_created_with_weighted', () => {
    // Arrange
    const source = RandomPieceSource.weighted(
      [
        { item: 2, weight: 90 },
        { item: 4, weight: 10 },
      ],
      new SeededRandom(2048),
    );

    // Act
    const draws = source.draw(1000);
    const twos = draws.filter((tile) => tile === 2).length;

    // Assert
    expect(twos).toBeGreaterThan(850);
    expect(twos).toBeLessThan(950);
  });

  it('should_throw_when_created_with_empty_pool_or_invalid_weights', () => {
    // Arrange
    const random = new SeededRandom(1);

    // Act & Assert
    expect(() => RandomPieceSource.uniform([], random)).toThrow(RangeError);
    expect(() => RandomPieceSource.weighted([], random)).toThrow(RangeError);
    expect(() =>
      RandomPieceSource.weighted([{ item: 'a', weight: 0 }], random),
    ).toThrow(RangeError);
    expect(() =>
      RandomPieceSource.weighted([{ item: 'a', weight: -1 }], random),
    ).toThrow(RangeError);
    expect(() =>
      RandomPieceSource.weighted(
        [{ item: 'a', weight: Number.POSITIVE_INFINITY }],
        random,
      ),
    ).toThrow(RangeError);
  });

  it('should_produce_the_same_future_pieces_independently_when_cloned', () => {
    // Arrange
    const original = RandomPieceSource.uniform(
      ['a', 'b', 'c', 'd'],
      new SeededRandom(77),
    );
    original.draw(3);
    const copy = original.clone();

    // Act
    const fromCopy = copy.draw(10);
    const fromOriginal = original.draw(10);

    // Assert
    expect(fromCopy).toEqual(fromOriginal);
  });
});
