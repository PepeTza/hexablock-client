import { SeededRandom } from '@domain/engine/random/seeded-random';
import type { ColorStack } from '@domain/variants/hexa-sort/color-stack';
import {
  SortStackSource,
  type SortTrayConfig,
} from '@domain/variants/hexa-sort/sort-stack-source';

const CONFIG: SortTrayConfig = {
  colors: 4,
  minHeight: 2,
  maxHeight: 6,
  maxColorsPerStack: 2,
};

function sourceWith(seed: number, config: SortTrayConfig = CONFIG) {
  return SortStackSource.create(config, new SeededRandom(seed));
}

/** How many runs of one colour make up the stack. */
function runsOf(stack: ColorStack): number {
  return stack.chips.filter((chip, i) => i === 0 || chip !== stack.chips[i - 1])
    .length;
}

describe('SortStackSource', () => {
  it('should_draw_the_same_stacks_when_the_seed_is_the_same', () => {
    // Act
    const first = sourceWith(42).draw(20);
    const second = sourceWith(42).draw(20);

    // Assert
    expect(first.map((stack) => stack.chips)).toEqual(
      second.map((stack) => stack.chips),
    );
  });

  it('should_respect_height_and_colour_limits_when_drawing', () => {
    // Act
    const stacks = sourceWith(7).draw(200);

    // Assert
    for (const stack of stacks) {
      expect(stack.height).toBeGreaterThanOrEqual(CONFIG.minHeight);
      expect(stack.height).toBeLessThanOrEqual(CONFIG.maxHeight);
      expect(new Set(stack.chips).size).toBeLessThanOrEqual(
        CONFIG.maxColorsPerStack,
      );
      expect(stack.chips.every((chip) => chip < CONFIG.colors)).toBe(true);
      // Neighbouring runs never share a colour.
      expect(runsOf(stack)).toBe(new Set(stack.chips).size);
    }
  });

  it('should_continue_independently_when_cloned', () => {
    // Arrange
    const source = sourceWith(3);
    source.draw(2);
    const copy = source.clone();

    // Act
    const fromCopy = copy.draw(5);
    const fromSource = source.draw(5);

    // Assert: same point in the sequence, separate positions afterwards.
    expect(fromCopy.map((stack) => stack.chips)).toEqual(
      fromSource.map((stack) => stack.chips),
    );
    expect(source.hasNext()).toBe(true);
  });

  it('should_draw_single_colour_stacks_when_one_colour_per_stack_is_allowed', () => {
    // Act
    const stacks = sourceWith(9, { ...CONFIG, maxColorsPerStack: 1 }).draw(50);

    // Assert
    expect(stacks.every((stack) => new Set(stack.chips).size === 1)).toBe(true);
  });

  it.each([
    [{ ...CONFIG, colors: 1 }, 'colors must be an integer from 2 to 8'],
    [{ ...CONFIG, colors: 9 }, 'colors must be an integer from 2 to 8'],
    [{ ...CONFIG, minHeight: 0 }, 'minHeight must be an integer from 1 to 9'],
    [
      { ...CONFIG, maxHeight: 1 },
      'maxHeight must be an integer from minHeight',
    ],
    [
      { ...CONFIG, maxHeight: 10 },
      'maxHeight must be an integer from minHeight',
    ],
    [{ ...CONFIG, maxColorsPerStack: 0 }, 'maxColorsPerStack must be'],
    [{ ...CONFIG, maxColorsPerStack: 5 }, 'maxColorsPerStack must be'],
  ])('should_reject_the_config_when_it_is_%j', (config, message) => {
    // Act / Assert
    expect(() => sourceWith(1, config)).toThrow(message);
  });
});
