import { ColorStack } from './color-stack';

describe('ColorStack', () => {
  it('should_count_only_the_top_run_when_colours_mix', () => {
    // Arrange: colour 1 appears four times, but only two lie on top.
    const stack = ColorStack.of([1, 1, 0, 1, 1]);

    // Act / Assert
    expect(stack.top()).toBe(1);
    expect(stack.topRun()).toBe(2);
    expect(stack.height).toBe(5);
  });

  it('should_expose_the_chips_below_when_removing_the_top_run', () => {
    // Arrange
    const stack = ColorStack.of([2, 0, 0]);

    // Act
    const rest = stack.withoutTopRun();

    // Assert
    expect(rest?.chips).toEqual([2]);
  });

  it('should_return_null_when_removing_the_only_run', () => {
    // Arrange
    const stack = ColorStack.of([3, 3, 3]);

    // Act / Assert
    expect(stack.withoutTopRun()).toBeNull();
  });

  it('should_return_a_new_stack_when_adding_a_run', () => {
    // Arrange
    const stack = ColorStack.of([0, 1]);

    // Act
    const grown = stack.plusRun(1, 2);

    // Assert: the original is untouched (value object).
    expect(grown.chips).toEqual([0, 1, 1, 1]);
    expect(grown.topRun()).toBe(3);
    expect(stack.chips).toEqual([0, 1]);
  });

  it('should_reject_an_empty_stack', () => {
    // Act / Assert
    expect(() => ColorStack.of([])).toThrow('A stack needs at least one chip');
  });

  it.each([-1, 1.5, Number.NaN])(
    'should_reject_a_chip_when_its_colour_is_%s',
    (chip) => {
      // Act / Assert
      expect(() => ColorStack.of([0, chip])).toThrow(
        'A chip colour must be an integer >= 0',
      );
    },
  );

  it('should_reject_a_run_when_it_has_no_chips', () => {
    // Act / Assert
    expect(() => ColorStack.of([0]).plusRun(0, 0)).toThrow(
      'A run needs at least one chip',
    );
  });

  it('should_compare_stacks_by_their_chips', () => {
    // Act / Assert
    expect(ColorStack.of([0, 1]).equals(ColorStack.of([0, 1]))).toBe(true);
    expect(ColorStack.of([0, 1]).equals(ColorStack.of([1, 0]))).toBe(false);
    expect(ColorStack.of([0]).equals(ColorStack.of([0, 0]))).toBe(false);
  });
});
