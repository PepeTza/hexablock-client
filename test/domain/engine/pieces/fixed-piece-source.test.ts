import { FixedPieceSource } from '@domain/engine/pieces/fixed-piece-source';

describe('FixedPieceSource', () => {
  it('should_return_pieces_in_order_and_null_when_exhausted', () => {
    // Arrange
    const source = new FixedPieceSource(['p1-01', 'p2-01']);

    // Act
    const hasFirst = source.hasNext();
    const first = source.next();
    const second = source.next();
    const afterLast = source.next();
    const hasMore = source.hasNext();

    // Assert
    expect(hasFirst).toBe(true);
    expect(first).toBe('p1-01');
    expect(second).toBe('p2-01');
    expect(afterLast).toBeNull();
    expect(hasMore).toBe(false);
  });

  it('should_draw_up_to_remaining_pieces_when_count_exceeds_available', () => {
    // Arrange
    const source = new FixedPieceSource([10, 20, 30]);
    source.next();

    // Act
    const drawn = source.draw(5);
    const empty = source.draw(2);

    // Assert
    expect(drawn).toEqual([20, 30]);
    expect(empty).toEqual([]);
    expect(source.hasNext()).toBe(false);
  });

  it('should_throw_when_draw_count_is_negative_or_not_an_integer', () => {
    // Arrange
    const source = new FixedPieceSource(['a', 'b']);

    // Act & Assert
    expect(() => source.draw(-1)).toThrow(RangeError);
    expect(() => source.draw(1.5)).toThrow(RangeError);
    expect(() => source.draw(Number.NaN)).toThrow(RangeError);
  });

  it('should_not_be_affected_when_the_input_array_is_mutated_externally', () => {
    // Arrange
    const input = ['a', 'b'];
    const source = new FixedPieceSource(input);

    // Act
    input.push('c');
    input[0] = 'mutated';
    const drawn = source.draw(5);

    // Assert
    expect(drawn).toEqual(['a', 'b']);
  });

  it('should_preserve_the_current_position_independently_when_cloned', () => {
    // Arrange
    const original = new FixedPieceSource(['a', 'b', 'c']);
    original.next();
    const copy = original.clone();

    // Act
    const fromCopy = copy.draw(2);
    const fromOriginal = original.draw(2);

    // Assert
    expect(fromCopy).toEqual(['b', 'c']);
    expect(fromOriginal).toEqual(['b', 'c']);
  });
});
