import { SeededRandom } from '@domain/engine/random/seeded-random';

describe('SeededRandom', () => {
  it('should_produce_the_same_sequence_when_given_the_same_seed', () => {
    // Arrange
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);

    // Act
    const sequenceA = Array.from({ length: 10 }, () => first.next());
    const sequenceB = Array.from({ length: 10 }, () => second.next());

    // Assert
    expect(sequenceA).toEqual(sequenceB);
  });

  it('should_produce_different_sequences_when_given_different_seeds', () => {
    // Arrange
    const first = new SeededRandom(42);
    const second = new SeededRandom(43);

    // Act
    const sequenceA = Array.from({ length: 10 }, () => first.next());
    const sequenceB = Array.from({ length: 10 }, () => second.next());

    // Assert
    expect(sequenceA).not.toEqual(sequenceB);
  });

  it('should_accept_zero_as_a_valid_seed_when_constructed', () => {
    // Arrange
    const random = new SeededRandom(0);

    // Act
    const values = Array.from({ length: 10 }, () => random.next());

    // Assert
    expect(random.seed).toBe(0);
    expect(new Set(values).size).toBe(10);
  });

  it('should_throw_when_seed_is_not_an_integer', () => {
    // Arrange
    const invalidSeeds = [1.5, Number.NaN, Number.POSITIVE_INFINITY];

    // Act & Assert
    for (const seed of invalidSeeds) {
      expect(() => new SeededRandom(seed)).toThrow(RangeError);
    }
  });

  it('should_return_values_within_half_open_unit_interval_when_calling_next', () => {
    // Arrange
    const random = new SeededRandom(12345);

    // Act
    const values = Array.from({ length: 500 }, () => random.next());

    // Assert
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should_return_integers_within_inclusive_bounds_when_calling_next_int', () => {
    // Arrange
    const random = new SeededRandom(99);

    // Act
    const rolls = Array.from({ length: 200 }, () => random.nextInt(1, 6));
    const single = random.nextInt(7, 7);

    // Assert
    expect(single).toBe(7);
    expect(rolls.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)).toBe(
      true,
    );
    expect(new Set(rolls)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('should_throw_when_next_int_bounds_are_invalid', () => {
    // Arrange
    const random = new SeededRandom(1);

    // Act & Assert
    expect(() => random.nextInt(5, 3)).toThrow(RangeError);
    expect(() => random.nextInt(0.5, 3)).toThrow(RangeError);
    expect(() => random.nextInt(0, Number.NaN)).toThrow(RangeError);
  });

  it('should_pick_items_from_the_list_when_calling_pick', () => {
    // Arrange
    const items = ['a', 'b', 'c', 'd'] as const;
    const first = new SeededRandom(7);
    const second = new SeededRandom(7);

    // Act
    const picksA = Array.from({ length: 40 }, () => first.pick(items));
    const picksB = Array.from({ length: 40 }, () => second.pick(items));

    // Assert
    expect(picksA).toEqual(picksB);
    expect(new Set(picksA)).toEqual(new Set(items));
  });

  it('should_throw_when_picking_from_an_empty_list', () => {
    // Arrange
    const random = new SeededRandom(7);

    // Act
    const act = () => random.pick([]);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it('should_respect_weights_when_calling_pick_weighted', () => {
    // Arrange
    const entries = [
      { item: 2, weight: 90 },
      { item: 4, weight: 10 },
    ] as const;
    const first = new SeededRandom(2048);
    const second = new SeededRandom(2048);

    // Act
    const drawsA = Array.from({ length: 1000 }, () =>
      first.pickWeighted(entries),
    );
    const drawsB = Array.from({ length: 1000 }, () =>
      second.pickWeighted(entries),
    );
    const twos = drawsA.filter((value) => value === 2).length;
    const fours = drawsA.filter((value) => value === 4).length;

    // Assert
    expect(drawsA).toEqual(drawsB);
    expect(twos + fours).toBe(1000);
    expect(twos).toBeGreaterThan(850);
    expect(twos).toBeLessThan(950);
  });

  it('should_throw_when_weighted_entries_are_empty_or_have_non_positive_weights', () => {
    // Arrange
    const random = new SeededRandom(1);

    // Act & Assert
    expect(() => random.pickWeighted([])).toThrow(RangeError);
    expect(() => random.pickWeighted([{ item: 'a', weight: 0 }])).toThrow(
      RangeError,
    );
    expect(() => random.pickWeighted([{ item: 'a', weight: -2 }])).toThrow(
      RangeError,
    );
    expect(() =>
      random.pickWeighted([{ item: 'a', weight: Number.POSITIVE_INFINITY }]),
    ).toThrow(RangeError);
    expect(() =>
      random.pickWeighted([{ item: 'a', weight: Number.NaN }]),
    ).toThrow(RangeError);
  });

  it('should_continue_with_the_exact_same_sequence_when_cloned', () => {
    // Arrange
    const original = new SeededRandom(31415);
    original.next();
    original.next();
    const copy = original.clone();

    // Act
    const fromOriginal = Array.from({ length: 10 }, () => original.next());
    const fromCopy = Array.from({ length: 10 }, () => copy.next());

    // Assert
    expect(fromCopy).toEqual(fromOriginal);
  });
});
