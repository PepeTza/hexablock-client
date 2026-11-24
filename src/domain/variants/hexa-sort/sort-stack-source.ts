import {
  assertDrawCount,
  type IPieceSource,
} from '../../engine/pieces/piece-source';
import type { IRandomSource } from '../../engine/random/random-source';
import { ColorStack } from './color-stack';

/** How the tray stacks are generated (level spec `colors` and `tray`). */
export interface SortTrayConfig {
  /** Colours in play, used as indexes `0` to `colors - 1` (2 to 8). */
  readonly colors: number;
  readonly minHeight: number;
  readonly maxHeight: number;
  /** Most different colours one stack may hold (1 to `colors`). */
  readonly maxColorsPerStack: number;
}

const MIN_COLORS = 2;
const MAX_COLORS = 8;
const MAX_HEIGHT = 9;

/**
 * Strategy (`IPieceSource`): the endless, seeded source of tray stacks in
 * Hexa Sort (RN-20). Each stack has a height between `minHeight` and
 * `maxHeight` and is made of runs of different colours, at most
 * `maxColorsPerStack` of them.
 *
 * Prototype: `clone()` clones the random source, so a preview (CU-03) never
 * advances the tray of the active game.
 */
export class SortStackSource implements IPieceSource<ColorStack> {
  private constructor(
    private readonly config: SortTrayConfig,
    private readonly random: IRandomSource,
  ) {}

  /** Validates the config eagerly, so a bad level fails at game start. */
  static create(
    config: SortTrayConfig,
    random: IRandomSource,
  ): SortStackSource {
    assertTrayConfig(config);
    return new SortStackSource({ ...config }, random);
  }

  hasNext(): boolean {
    return true;
  }

  next(): ColorStack {
    const { colors, minHeight, maxHeight, maxColorsPerStack } = this.config;
    const height = this.random.nextInt(minHeight, maxHeight);
    const runs = this.random.nextInt(1, Math.min(maxColorsPerStack, height));

    // Distinct colours, so two neighbouring runs never share a colour.
    const available = Array.from({ length: colors }, (_, color) => color);
    const plan = Array.from({ length: runs }, () => {
      const color = this.random.pick(available);
      available.splice(available.indexOf(color), 1);
      // Every run starts with one chip.
      return { color, length: 1 };
    });

    // The remaining chips go to random runs.
    for (let extra = height - runs; extra > 0; extra--) {
      const run = plan[this.random.nextInt(0, runs - 1)];
      if (run !== undefined) {
        run.length += 1;
      }
    }

    return ColorStack.of(
      plan.flatMap(({ color, length }) => Array<number>(length).fill(color)),
    );
  }

  draw(count: number): ColorStack[] {
    assertDrawCount(count);
    return Array.from({ length: count }, () => this.next());
  }

  clone(): SortStackSource {
    return new SortStackSource(this.config, this.random.clone());
  }
}

function assertTrayConfig(config: SortTrayConfig): void {
  const { colors, minHeight, maxHeight, maxColorsPerStack } = config;
  if (!isIntIn(colors, MIN_COLORS, MAX_COLORS)) {
    throw new RangeError(
      `colors must be an integer from ${MIN_COLORS} to ${MAX_COLORS}: ${colors}`,
    );
  }
  if (!isIntIn(minHeight, 1, MAX_HEIGHT)) {
    throw new RangeError(
      `minHeight must be an integer from 1 to ${MAX_HEIGHT}: ${minHeight}`,
    );
  }
  if (!isIntIn(maxHeight, minHeight, MAX_HEIGHT)) {
    throw new RangeError(
      `maxHeight must be an integer from minHeight to ${MAX_HEIGHT}: ${maxHeight}`,
    );
  }
  if (!isIntIn(maxColorsPerStack, 1, colors)) {
    throw new RangeError(
      `maxColorsPerStack must be an integer from 1 to colors: ${maxColorsPerStack}`,
    );
  }
}

function isIntIn(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
